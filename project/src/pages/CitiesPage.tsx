import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { City } from '../types';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [adCounts, setAdCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('cities').select('*').eq('is_active', true).order('sort_order');
      setCities(data ?? []);
      const counts: Record<string, number> = {};
      await Promise.all((data ?? []).map(async city => {
        const { count } = await supabase.from('ads').select('*', { count: 'exact', head: true })
          .eq('city_id', city.id).eq('status', 'published');
        counts[city.id] = count ?? 0;
      }));
      setAdCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  const groupedByProvince = cities.reduce<Record<string, City[]>>((acc, city) => {
    const prov = city.province || 'Other';
    if (!acc[prov]) acc[prov] = [];
    acc[prov].push(city);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse by City</h1>
          <p className="text-gray-500 mb-8">Find ads in your city</p>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            Object.entries(groupedByProvince).map(([province, citiesInProv]) => (
              <div key={province} className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />{province}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {citiesInProv.map(city => (
                    <Link
                      key={city.id}
                      to={`/cities/${city.slug}`}
                      className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600">{city.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{adCounts[city.id] ?? 0} ads</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
