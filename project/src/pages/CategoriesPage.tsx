import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';

const categoryEmojis: Record<string, string> = {
  Electronics: '📱', Vehicles: '🚗', 'Real Estate': '🏠', Jobs: '💼',
  Fashion: '👗', Furniture: '🪑', Services: '🔧', Education: '📚',
  Sports: '⚽', 'Food & Kitchen': '🍳', Pets: '🐾', Other: '📦',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [adCounts, setAdCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
      setCategories(cats ?? []);

      const counts: Record<string, number> = {};
      await Promise.all((cats ?? []).map(async cat => {
        const { count } = await supabase.from('ads').select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id).eq('status', 'published');
        counts[cat.id] = count ?? 0;
      }));
      setAdCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Browse Categories</h1>
            <p className="text-gray-500 mt-1">Find exactly what you're looking for</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all text-center"
                >
                  <div className="text-4xl mb-3">{categoryEmojis[cat.name] ?? '📦'}</div>
                  <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{cat.name}</h2>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
                  <div className="mt-3 inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {adCounts[cat.id] ?? 0} ads
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
