import { useEffect, useState } from 'react';
import { Link } from '../../lib/router';
import { PlusCircle, Eye, CreditCard as Edit, Clock, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ad, AdStatus } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PLACEHOLDER_IMAGE } from '../../lib/mediaUtils';

export default function MyAdsPage() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AdStatus | 'all'>('all');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('ads')
      .select('*, packages(*), categories(*), cities(*), ad_media(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setAds(data ?? []); setLoading(false); });
  }, [user]);

  const filtered = filter === 'all' ? ads : ads.filter(a => a.status === filter);

  const filterOptions: { value: AdStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'payment_pending', label: 'Payment Pending' },
    { value: 'published', label: 'Published' },
    { value: 'expired', label: 'Expired' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <DashboardLayout title="My Ads">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ml-1.5 opacity-70">
                    {ads.filter(a => a.status === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Link
            to="/dashboard/create-ad"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Ad
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-lg font-medium">No ads found</p>
            <Link to="/dashboard/create-ad" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium">
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ad => {
              const thumb = ad.ad_media?.[0]?.thumbnail_url || PLACEHOLDER_IMAGE;
              const daysLeft = ad.expire_at
                ? Math.max(0, Math.ceil((new Date(ad.expire_at).getTime() - Date.now()) / 86400000))
                : null;

              return (
                <div key={ad.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition">
                  <div className="flex gap-4">
                    <img
                      src={thumb}
                      alt={ad.title}
                      className="w-20 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{ad.title}</h3>
                        <StatusBadge status={ad.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {ad.categories && <span>{ad.categories.name}</span>}
                        {ad.cities && <span>{ad.cities.name}</span>}
                        <span>Posted {new Date(ad.created_at).toLocaleDateString()}</span>
                      </div>
                      {ad.price !== null && ad.price !== undefined && (
                        <p className="text-blue-700 font-bold text-sm mt-1">PKR {ad.price.toLocaleString()}</p>
                      )}
                      {daysLeft !== null && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${daysLeft < 3 ? 'text-red-500' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {daysLeft} days remaining
                        </p>
                      )}
                      {ad.rejection_reason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {ad.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {ad.status === 'payment_pending' && (
                        <Link
                          to={`/dashboard/payment/${ad.id}`}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium"
                        >
                          Pay Now
                        </Link>
                      )}
                      {['draft', 'rejected'].includes(ad.status) && (
                        <Link
                          to={`/dashboard/edit-ad/${ad.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Link>
                      )}
                      {ad.status === 'published' && (
                        <Link
                          to={`/ads/${ad.slug || ad.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
