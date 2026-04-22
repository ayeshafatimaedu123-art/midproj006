import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Flag, MessageSquare, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ad } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PLACEHOLDER_IMAGE } from '../../lib/mediaUtils';

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('ads')
      .select('*, packages(*), categories(*), cities(*), ad_media(*), users!ads_user_id_fkey(name, email)')
      .in('status', ['submitted', 'under_review'])
      .order('created_at', { ascending: true });
    setQueue(data ?? []);

    const [pend, appr, rej] = await Promise.all([
      supabase.from('ads').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
      supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'payment_pending'),
      supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    setStats({ pending: pend.count ?? 0, approved: appr.count ?? 0, rejected: rej.count ?? 0 });
    setLoading(false);
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (!selectedAd || !user) return;
    setActionLoading(true);

    const newStatus = action === 'approve' ? 'payment_pending' : action === 'reject' ? 'rejected' : 'under_review';
    const prevStatus = selectedAd.status;

    await supabase.from('ads').update({
      status: newStatus,
      moderation_notes: notes,
      rejection_reason: action === 'reject' ? rejectionReason : undefined,
    }).eq('id', selectedAd.id);

    await supabase.from('ad_status_history').insert({
      ad_id: selectedAd.id, previous_status: prevStatus, new_status: newStatus,
      changed_by: user.id, note: notes || `Moderator ${action}`,
    });

    await supabase.from('audit_logs').insert({
      actor_id: user.id, action_type: `ad_${action}`, target_type: 'ad',
      target_id: selectedAd.id, new_value: { status: newStatus, notes },
    });

    await supabase.from('notifications').insert({
      user_id: selectedAd.user_id,
      title: action === 'approve' ? 'Ad Approved - Payment Required' : action === 'reject' ? 'Ad Rejected' : 'Ad Flagged for Review',
      message: action === 'approve'
        ? `Your ad "${selectedAd.title}" passed review. Please select a package and submit payment.`
        : action === 'reject'
        ? `Your ad "${selectedAd.title}" was rejected. Reason: ${rejectionReason}`
        : `Your ad "${selectedAd.title}" is flagged and under additional review.`,
      type: action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning',
    });

    setSelectedAd(null);
    setNotes('');
    setRejectionReason('');
    await fetchQueue();
    setActionLoading(false);
  };

  return (
    <DashboardLayout title="Moderator Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatsCard label="Pending Review" value={stats.pending} icon={<Eye className="w-5 h-5" />} color="amber" />
          <StatsCard label="Moved to Payment" value={stats.approved} icon={<CheckCircle className="w-5 h-5" />} color="green" />
          <StatsCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-5 h-5" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Review Queue ({queue.length})</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : queue.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <p className="text-sm">All clear! No ads pending review.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {queue.map(ad => (
                  <button
                    key={ad.id}
                    onClick={() => { setSelectedAd(ad); setNotes(''); setRejectionReason(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition ${selectedAd?.id === ad.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <img
                      src={ad.ad_media?.[0]?.thumbnail_url || PLACEHOLDER_IMAGE}
                      alt={ad.title}
                      className="w-12 h-10 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{ad.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(ad.users as { name?: string })?.name} • {ad.categories?.name} • {new Date(ad.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      ad.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ad.status === 'under_review' ? 'In Review' : 'New'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {!selectedAd ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Eye className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">Select an ad from the queue to review</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{selectedAd.title}</h3>
                  {selectedAd.ad_media?.[0]?.original_url && (
                    <a href={selectedAd.ad_media[0].original_url} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedAd.ad_media?.[0] && (
                    <img
                      src={selectedAd.ad_media[0].thumbnail_url || PLACEHOLDER_IMAGE}
                      alt="Ad media"
                      className="w-full aspect-video object-cover rounded-xl bg-gray-100"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    />
                  )}
                  <div className="text-sm space-y-1.5 text-gray-600">
                    <p><span className="font-medium text-gray-900">Category:</span> {selectedAd.categories?.name}</p>
                    <p><span className="font-medium text-gray-900">City:</span> {selectedAd.cities?.name}</p>
                    <p><span className="font-medium text-gray-900">Seller:</span> {(selectedAd.users as { name?: string })?.name}</p>
                    {selectedAd.price && <p><span className="font-medium text-gray-900">Price:</span> PKR {selectedAd.price.toLocaleString()}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Description</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed">{selectedAd.description || 'No description'}</p>
                  </div>

                  {/* Media URLs */}
                  {selectedAd.ad_media && selectedAd.ad_media.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Media URLs</p>
                      {selectedAd.ad_media.map(m => (
                        <a key={m.id} href={m.original_url} target="_blank" rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline truncate">
                          {m.source_type}: {m.original_url}
                        </a>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Internal Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Add moderation notes..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={2}
                      placeholder="Explain why this ad is being rejected..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('flag')}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-amber-300 text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-50 transition disabled:opacity-50"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
