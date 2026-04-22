import { useEffect, useState } from 'react';
import { Link } from '../../lib/router';
import { FileText, Clock, CheckCircle, XCircle, PlusCircle, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ad, Notification } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('ads').select('*, packages(*), categories(*), cities(*), ad_media(*)')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5),
    ]).then(([adsRes, notifRes]) => {
      setAds(adsRes.data ?? []);
      setNotifications(notifRes.data ?? []);
      setLoading(false);
    });
  }, [user]);

  const stats = {
    total: ads.length,
    published: ads.filter(a => a.status === 'published').length,
    pending: ads.filter(a => ['submitted', 'under_review', 'payment_pending', 'payment_submitted'].includes(a.status)).length,
    expired: ads.filter(a => a.status === 'expired').length,
  };

  const recentAds = ads.slice(0, 5);

  return (
    <DashboardLayout title="My Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-blue-100 text-sm mb-4">Manage your listings and track their performance.</p>
          <Link
            to="/dashboard/create-ad"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Post New Ad
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Ads" value={stats.total} icon={<FileText className="w-5 h-5" />} color="blue" />
            <StatsCard label="Published" value={stats.published} icon={<CheckCircle className="w-5 h-5" />} color="green" />
            <StatsCard label="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
            <StatsCard label="Expired" value={stats.expired} icon={<XCircle className="w-5 h-5" />} color="red" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Ads */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Recent Listings</h3>
                <Link to="/dashboard/my-ads" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : recentAds.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No ads yet</p>
                  <Link to="/dashboard/create-ad" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
                    Post your first ad
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentAds.map(ad => (
                    <div key={ad.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{ad.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                          {ad.categories && <span>{ad.categories.name}</span>}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <StatusBadge status={ad.status} />
                        {ad.status === 'payment_pending' && (
                          <Link
                            to={`/dashboard/payment/${ad.id}`}
                            className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full hover:bg-orange-600"
                          >
                            Pay Now
                          </Link>
                        )}
                        {ad.status === 'published' && (
                          <Link to={`/ads/${ad.slug || ad.id}`} className="text-gray-400 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.is_read).length} new
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          n.type === 'success' ? 'text-green-500' :
                          n.type === 'warning' ? 'text-amber-500' :
                          n.type === 'error' ? 'text-red-500' : 'text-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/dashboard/create-ad" className="flex items-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  <PlusCircle className="w-4 h-4" />
                  Post New Ad
                </Link>
                <Link to="/dashboard/my-ads" className="flex items-center gap-2 w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  <FileText className="w-4 h-4" />
                  View All Ads
                </Link>
                <Link to="/packages" className="flex items-center gap-2 w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  <Eye className="w-4 h-4" />
                  View Packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
