import { useEffect, useState } from 'react';
import { Link } from '../../lib/router';
import { FileText, DollarSign, Users, Activity, Clock, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Ad, Payment } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, published: 0, pending: 0, expired: 0,
    totalUsers: 0, pendingPayments: 0, verifiedRevenue: 0,
  });
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function load() {
      const [totalAds, pubAds, pendAds, expAds, totalUsers, pendPay, verPay, ads, payments] = await Promise.all([
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('ads').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review', 'payment_submitted']),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('amount').eq('status', 'verified'),
        supabase.from('ads').select('*, packages(*), categories(*), cities(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('*, ads(title), users!payments_user_id_fkey(name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const revenue = verPay.data?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
      setStats({
        total: totalAds.count ?? 0,
        published: pubAds.count ?? 0,
        pending: pendAds.count ?? 0,
        expired: expAds.count ?? 0,
        totalUsers: totalUsers.count ?? 0,
        pendingPayments: pendPay.count ?? 0,
        verifiedRevenue: revenue,
      });
      setRecentAds(ads.data ?? []);
      setRecentPayments(payments.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Ads" value={stats.total} icon={<FileText className="w-5 h-5" />} color="blue" />
              <StatsCard label="Published" value={stats.published} icon={<CheckCircle className="w-5 h-5" />} color="green" />
              <StatsCard label="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
              <StatsCard label="Pending Payments" value={stats.pendingPayments} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                label="Total Users"
                value={stats.totalUsers}
                icon={<Users className="w-5 h-5" />}
                color="teal"
              />
              <StatsCard
                label="Verified Revenue"
                value={`PKR ${stats.verifiedRevenue.toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5" />}
                color="green"
              />
              <StatsCard
                label="Expired Ads"
                value={stats.expired}
                icon={<TrendingUp className="w-5 h-5" />}
                color="gray"
              />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/admin/payments', label: 'Payment Queue', icon: <DollarSign className="w-4 h-4" />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { to: '/moderator', label: 'Review Queue', icon: <Activity className="w-4 h-4" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                { to: '/admin/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { to: '/admin/health', label: 'System Health', icon: <Activity className="w-4 h-4" />, color: 'bg-green-50 text-green-700 border-green-200' },
              ].map(item => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-2 p-4 rounded-xl border ${item.color} hover:shadow-sm transition font-medium text-sm`}>
                  {item.icon}{item.label}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Ads */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Recent Submissions</h3>
                  <Link to="/moderator" className="text-xs text-blue-600 hover:underline">View queue</Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentAds.map(ad => (
                    <div key={ad.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{ad.title}</p>
                        <p className="text-xs text-gray-500">{ad.categories?.name} • {new Date(ad.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={ad.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Payments */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Recent Payments</h3>
                  <Link to="/admin/payments" className="text-xs text-blue-600 hover:underline">View all</Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentPayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {(p.ads as { title?: string })?.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          PKR {p.amount.toLocaleString()} • {(p.users as { name?: string })?.name}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'verified' ? 'bg-green-100 text-green-700' :
                        p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
