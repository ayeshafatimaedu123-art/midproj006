import { useEffect, useState } from 'react';
import { useParams, Link } from '../lib/router';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad, Category } from '../types';
import AdCard from '../components/common/AdCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

const PAGE_SIZE = 12;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => setCategory(data));
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    supabase
      .from('ads')
      .select('*, packages(*), categories(*), cities(*), ad_media(*)', { count: 'exact' })
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('rank_score', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .then(({ data, count }) => {
        setAds(data ?? []);
        setTotal(count ?? 0);
        setLoading(false);
      });
  }, [category, page]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/categories" className="hover:text-blue-600">Categories</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{category?.name ?? slug}</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category?.name ?? 'Category'}</h1>
              <p className="text-gray-500 mt-1">{total.toLocaleString()} active listings</p>
            </div>
            <Link to="/explore" className="text-sm text-blue-600 hover:underline">Browse all</Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : ads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <p className="text-xl font-semibold text-gray-400">No ads in this category yet</p>
              <Link to="/dashboard/create-ad" className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
                Post First Ad
              </Link>
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
