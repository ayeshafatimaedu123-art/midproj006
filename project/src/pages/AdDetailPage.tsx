import { useEffect, useState } from 'react';
import { useParams, Link } from '../lib/router';
import { MapPin, Phone, Mail, Clock, Eye, Flag, Star, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad, AdStatusHistory } from '../types';
import MediaPreview from '../components/common/MediaPreview';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

export default function AdDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedAds, setRelatedAds] = useState<Ad[]>([]);

  useEffect(() => {
    async function load() {
      if (!slug) return;

      const { data } = await supabase
        .from('ads')
        .select(`
          *,
          packages(*),
          categories(*),
          cities(*),
          ad_media(*),
          users!ads_user_id_fkey(id, name),
          seller_profiles(*)
        `)
        .eq('status', 'published')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (data) {
        setAd(data);
        await supabase.from('ads').update({ views_count: (data.views_count ?? 0) + 1 }).eq('id', data.id);

        if (data.category_id) {
          const { data: related } = await supabase
            .from('ads')
            .select('*, packages(*), categories(*), cities(*), ad_media(*)')
            .eq('status', 'published')
            .eq('category_id', data.category_id)
            .neq('id', data.id)
            .limit(4);
          setRelatedAds(related ?? []);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return <Layout><div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div></Layout>;
  }

  if (!ad) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-32 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ad Not Found</h2>
          <p className="text-gray-500 mb-6">This listing may have expired or been removed.</p>
          <Link to="/explore" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
            Browse Ads
          </Link>
        </div>
      </Layout>
    );
  }

  const packageBadge: Record<string, string> = {
    Premium: 'bg-amber-100 text-amber-700',
    Standard: 'bg-blue-100 text-blue-700',
    Basic: 'bg-gray-100 text-gray-700',
  };

  const daysLeft = ad.expire_at
    ? Math.max(0, Math.ceil((new Date(ad.expire_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/explore" className="hover:text-blue-600">Explore</Link>
            {ad.categories && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link to={`/categories/${ad.categories.slug}`} className="hover:text-blue-600">{ad.categories.name}</Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium truncate max-w-xs">{ad.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Media + Details */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <MediaPreview media={ad.ad_media} className="w-full" />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  {ad.is_featured && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-amber-700" /> Featured
                    </span>
                  )}
                  {ad.packages && (
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${packageBadge[ad.packages.name] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ad.packages.name} Package
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">{ad.title}</h1>

                {ad.price !== null && ad.price !== undefined && (
                  <p className="text-3xl font-black text-blue-700 mb-4">
                    {ad.price_label || `PKR ${ad.price.toLocaleString()}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
                  {ad.cities && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {ad.cities.name}, {ad.cities.province}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-gray-400" />
                    {ad.views_count} views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Posted {new Date(ad.created_at).toLocaleDateString()}
                  </span>
                  {daysLeft !== null && (
                    <span className={`flex items-center gap-1.5 ${daysLeft < 3 ? 'text-red-500' : ''}`}>
                      <Clock className="w-4 h-4" />
                      {daysLeft} days left
                    </span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{ad.description}</p>
                </div>
              </div>
            </div>

            {/* Right: Seller + Actions */}
            <div className="space-y-5">
              {/* Seller Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                    {(ad.seller_profiles?.display_name || ad.users?.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      {ad.seller_profiles?.display_name || ad.users?.name || 'Seller'}
                      {ad.seller_profiles?.is_verified && (
                        <Shield className="w-4 h-4 text-blue-600 fill-blue-600" />
                      )}
                    </p>
                    {ad.seller_profiles?.business_name && (
                      <p className="text-xs text-gray-500">{ad.seller_profiles.business_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {ad.contact_phone && (
                    <a
                      href={`tel:${ad.contact_phone}`}
                      className="flex items-center gap-3 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition"
                    >
                      <Phone className="w-4 h-4" />
                      {ad.contact_phone}
                    </a>
                  )}
                  {ad.contact_email && (
                    <a
                      href={`mailto:${ad.contact_email}`}
                      className="flex items-center gap-3 w-full px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition"
                    >
                      <Mail className="w-4 h-4" />
                      Email Seller
                    </a>
                  )}
                  <button className="flex items-center gap-3 w-full px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-medium text-sm transition">
                    <Flag className="w-4 h-4" />
                    Report Ad
                  </button>
                </div>
              </div>

              {/* Ad Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Ad Details</h3>
                <dl className="space-y-2 text-sm">
                  {ad.categories && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Category</dt>
                      <dd className="font-medium text-gray-900">
                        <Link to={`/categories/${ad.categories.slug}`} className="text-blue-600 hover:underline">
                          {ad.categories.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {ad.cities && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Location</dt>
                      <dd className="font-medium text-gray-900">
                        <Link to={`/cities/${ad.cities.slug}`} className="text-blue-600 hover:underline">
                          {ad.cities.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Ad ID</dt>
                    <dd className="font-medium text-gray-400 text-xs">{ad.id.slice(0, 8)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Related Ads */}
          {relatedAds.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Listings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedAds.map(ra => (
                  <Link key={ra.id} to={`/ads/${ra.slug || ra.id}`} className="group block bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden">
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={ra.ad_media?.[0]?.thumbnail_url || 'https://images.pexels.com/photos/5632392/pexels-photo-5632392.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={ra.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/5632392/pexels-photo-5632392.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600">{ra.title}</p>
                      {ra.price !== null && ra.price !== undefined && (
                        <p className="text-blue-700 font-bold text-sm mt-1">PKR {ra.price.toLocaleString()}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
