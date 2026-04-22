import { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Clock, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SystemHealthLog } from '../../types';

export default function SystemHealthPage() {
  const [logs, setLogs] = useState<SystemHealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [dbStatus, setDbStatus] = useState<'ok' | 'warning' | 'error' | null>(null);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(50);
    setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const runHeartbeat = async () => {
    setRunning(true);
    const start = Date.now();
    try {
      const { error } = await supabase.from('users').select('id', { head: true, count: 'exact' });
      const ms = Date.now() - start;
      const status = error ? 'error' : ms > 1000 ? 'warning' : 'ok';
      setDbStatus(status);

      await supabase.from('system_health_logs').insert({
        source: 'db_heartbeat',
        response_ms: ms,
        status,
        message: error ? error.message : `DB responded in ${ms}ms`,
      });
    } catch (e) {
      setDbStatus('error');
      await supabase.from('system_health_logs').insert({
        source: 'db_heartbeat',
        response_ms: 0,
        status: 'error',
        message: 'Connection failed',
      });
    }
    await fetchLogs();
    setRunning(false);
  };

  const runPublishCron = async () => {
    setRunning(true);
    const now = new Date().toISOString();
    const { data: toPublish } = await supabase
      .from('ads')
      .select('id, title, user_id')
      .eq('status', 'scheduled')
      .lte('publish_at', now);

    let published = 0;
    for (const ad of toPublish ?? []) {
      await supabase.from('ads').update({ status: 'published' }).eq('id', ad.id);
      await supabase.from('ad_status_history').insert({
        ad_id: ad.id, previous_status: 'scheduled', new_status: 'published',
        note: 'Published by cron job',
      });
      published++;
    }

    await supabase.from('system_health_logs').insert({
      source: 'cron_publish',
      response_ms: 0,
      status: 'ok',
      message: `Published ${published} scheduled ads`,
    });

    await fetchLogs();
    setRunning(false);
  };

  const runExpireCron = async () => {
    setRunning(true);
    const now = new Date().toISOString();
    const { data: toExpire } = await supabase
      .from('ads')
      .select('id, title, user_id, expire_at')
      .eq('status', 'published')
      .lte('expire_at', now);

    let expired = 0;
    for (const ad of toExpire ?? []) {
      await supabase.from('ads').update({ status: 'expired' }).eq('id', ad.id);
      await supabase.from('notifications').insert({
        user_id: ad.user_id, title: 'Ad Expired',
        message: `Your ad "${ad.title}" has expired.`, type: 'warning',
      });
      expired++;
    }

    await supabase.from('system_health_logs').insert({
      source: 'cron_expire',
      response_ms: 0,
      status: 'ok',
      message: `Expired ${expired} ads`,
    });

    await fetchLogs();
    setRunning(false);
  };

  const statusIcon = (s: string) =>
    s === 'ok' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
    s === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
    <XCircle className="w-4 h-4 text-red-500" />;

  const latestDb = logs.find(l => l.source === 'db_heartbeat');
  const latestPublish = logs.find(l => l.source === 'cron_publish');
  const latestExpire = logs.find(l => l.source === 'cron_expire');

  return (
    <DashboardLayout title="System Health">
      <div className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Database', icon: <Activity className="w-5 h-5" />,
              status: latestDb?.status ?? 'unknown',
              detail: latestDb ? `${latestDb.response_ms}ms • ${new Date(latestDb.checked_at).toLocaleTimeString()}` : 'No data',
            },
            {
              label: 'Publish Cron', icon: <Zap className="w-5 h-5" />,
              status: latestPublish?.status ?? 'unknown',
              detail: latestPublish ? latestPublish.message : 'Never run',
            },
            {
              label: 'Expire Cron', icon: <Clock className="w-5 h-5" />,
              status: latestExpire?.status ?? 'unknown',
              detail: latestExpire ? latestExpire.message : 'Never run',
            },
          ].map(item => (
            <div key={item.label} className={`bg-white rounded-2xl border-2 p-5 ${
              item.status === 'ok' ? 'border-green-200' :
              item.status === 'warning' ? 'border-amber-200' :
              item.status === 'error' ? 'border-red-200' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  {item.icon}{item.label}
                </div>
                {statusIcon(item.status)}
              </div>
              <p className="text-xs text-gray-500">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Manual Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Manual Controls</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runHeartbeat}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition"
            >
              <Activity className="w-4 h-4" />
              Run DB Heartbeat
            </button>
            <button
              onClick={runPublishCron}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium transition"
            >
              <Zap className="w-4 h-4" />
              Run Publish Cron
            </button>
            <button
              onClick={runExpireCron}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-xl text-sm font-medium transition"
            >
              <Clock className="w-4 h-4" />
              Run Expire Cron
            </button>
            <button
              onClick={fetchLogs}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Logs
            </button>
          </div>
          {running && <div className="mt-3 flex items-center gap-2 text-sm text-blue-600"><LoadingSpinner size="sm" /> Running...</div>}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Health Logs</h3>
            <span className="text-xs text-gray-400">{logs.length} entries</span>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No logs yet. Run a health check.</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                  {statusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{log.source.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 truncate">{log.message}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {log.response_ms > 0 && <p className="text-xs text-gray-500">{log.response_ms}ms</p>}
                    <p className="text-xs text-gray-400">{new Date(log.checked_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
