import { useEffect, useState } from 'react';
import { useParams, Link } from '../lib/router';
import { ChevronRight, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad, City } from '../types';
import AdCard from '../components/common/AdCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

const PAGE_SIZE = 12;

export default function CityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [city, setCity] = useState<City | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('cities').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => setCity(data));
  }, [slug]);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    supabase
      .from('ads')
      .select('*, packages(*), categories(*), cities(*), ad_media(*)', { count: 'exact' })
      .eq('status', 'published')
      .eq('city_id', city.id)
      .order('rank_score', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setAds(data ?? []);
        setTotal(count ?? 0);
        setLoading(false);
      });
  }, [city, page]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/cities" className="hover:text-blue-600">Cities</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{city?.name ?? slug}</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{city?.name ?? 'City'}</h1>
              <p className="text-gray-500 text-sm">{city?.province} • {total.toLocaleString()} listings</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : ads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-xl font-semibold text-gray-400">No ads in {city?.name} yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
              <div className="flex justify-center">
                <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
