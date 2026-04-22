import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from '../lib/router';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad, Category, City } from '../types';
import AdCard from '../components/common/AdCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

const PAGE_SIZE = 12;

export default function ExploreAdsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const citySlug = searchParams.get('city') ?? '';
  const sort = searchParams.get('sort') ?? 'rank';
  const featured = searchParams.get('featured') === 'true';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('cities').select('*').eq('is_active', true).order('sort_order'),
    ]).then(([cats, cits]) => {
      setCategories(cats.data ?? []);
      setCities(cits.data ?? []);
    });
  }, []);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('ads')
      .select('*, packages(*), categories(*), cities(*), ad_media(*)', { count: 'exact' })
      .eq('status', 'published');

    if (q) query = query.ilike('title', `%${q}%`);
    if (featured) query = query.eq('is_featured', true);

    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug);
      if (cat) query = query.eq('category_id', cat.id);
    }
    if (citySlug) {
      const city = cities.find(c => c.slug === citySlug);
      if (city) query = query.eq('city_id', city.id);
    }

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('rank_score', { ascending: false });

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, count } = await query;
    setAds(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [q, categorySlug, citySlug, sort, featured, page, categories, cities]);

  useEffect(() => {
    if (categories.length || cities.length || (!categorySlug && !citySlug)) {
      fetchAds();
    }
  }, [fetchAds]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Explore Ads</h1>
            <p className="text-gray-500 mt-1">{total.toLocaleString()} listings found</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className={`lg:w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Filters</h2>
                  {(q || categorySlug || citySlug || featured) && (
                    <button
                      onClick={() => setSearchParams(new URLSearchParams())}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={q}
                      onChange={e => setParam('q', e.target.value)}
                      placeholder="Keywords..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                  <select
                    value={categorySlug}
                    onChange={e => setParam('category', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="mb-5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">City</label>
                  <select
                    value={citySlug}
                    onChange={e => setParam('city', e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Cities</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Featured */}
                <div className="mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={e => setParam('featured', e.target.checked ? 'true' : '')}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Featured only</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort + mobile filter toggle */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sort}
                    onChange={e => setParam('sort', e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rank">Best Match</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Active filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {q && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Search: {q}
                    <button onClick={() => setParam('q', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {categorySlug && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {categories.find(c => c.slug === categorySlug)?.name}
                    <button onClick={() => setParam('category', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {citySlug && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {cities.find(c => c.slug === citySlug)?.name}
                    <button onClick={() => setParam('city', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
              ) : ads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-400 text-lg font-medium">No ads found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
                  </div>
                  <div className="flex justify-center mt-8">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onChange={p => {
                        const next = new URLSearchParams(searchParams);
                        next.set('page', String(p));
                        setSearchParams(next);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
