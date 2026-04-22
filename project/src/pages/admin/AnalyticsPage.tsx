import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface CategoryStat { name: string; count: number }
interface CityStat { name: string; count: number }
interface PackageStat { name: string; count: number; revenue: number }

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0, active: 0, pending: 0, expired: 0,
    totalRevenue: 0, verifiedPayments: 0, approvalRate: 0, flaggedAds: 0,
  });
  const [catStats, setCatStats] = useState<CategoryStat[]>([]);
  const [cityStats, setCityStats] = useState<CityStat[]>([]);
  const [pkgStats, setPkgStats] = useState<PackageStat[]>([]);

  useEffect(() => {
    async function load() {
      const [total, active, pending, expired, rejected, submitted, verPay, totalUsers] = await Promise.all([
        supabase.from('ads').select('id', { count: 'exact', head: true }),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('ads').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('ads').select('id', { count: 'exact', head: true }).neq('status', 'draft'),
        supabase.from('payments').select('amount').eq('status', 'verified'),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ]);

      const revenue = verPay.data?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
      const totalNonDraft = submitted.count ?? 1;
      const approvalRate = totalNonDraft > 0 ? Math.round(((active.count ?? 0) / totalNonDraft) * 100) : 0;

      setSummary({
        total: total.count ?? 0,
        active: active.count ?? 0,
        pending: pending.count ?? 0,
        expired: expired.count ?? 0,
        totalRevenue: revenue,
        verifiedPayments: verPay.data?.length ?? 0,
        approvalRate,
        flaggedAds: rejected.count ?? 0,
      });

      // Category stats
      const { data: catData } = await supabase
        .from('ads')
        .select('category_id, categories(name)')
        .eq('status', 'published')
        .not('category_id', 'is', null);

      const catMap: Record<string, { name: string; count: number }> = {};
      for (const row of catData ?? []) {
        const catId = row.category_id as string;
        const name = (row.categories as { name?: string })?.name ?? 'Unknown';
        if (!catMap[catId]) catMap[catId] = { name, count: 0 };
        catMap[catId].count++;
      }
      setCatStats(Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 8));

      // City stats
      const { data: cityData } = await supabase
        .from('ads')
        .select('city_id, cities(name)')
        .eq('status', 'published')
        .not('city_id', 'is', null);

      const cityMap: Record<string, { name: string; count: number }> = {};
      for (const row of cityData ?? []) {
        const cityId = row.city_id as string;
        const name = (row.cities as { name?: string })?.name ?? 'Unknown';
        if (!cityMap[cityId]) cityMap[cityId] = { name, count: 0 };
        cityMap[cityId].count++;
      }
      setCityStats(Object.values(cityMap).sort((a, b) => b.count - a.count).slice(0, 8));

      // Package stats
      const { data: pkgData } = await supabase
        .from('payments')
        .select('amount, status, ads(package_id, packages(name))')
        .eq('status', 'verified');

      const pkgMap: Record<string, PackageStat> = {};
      for (const p of pkgData ?? []) {
        const name = (p.ads as { packages?: { name?: string } })?.packages?.name ?? 'Unknown';
        if (!pkgMap[name]) pkgMap[name] = { name, count: 0, revenue: 0 };
        pkgMap[name].count++;
        pkgMap[name].revenue += p.amount ?? 0;
      }
      setPkgStats(Object.values(pkgMap));

      setLoading(false);
    }
    load();
  }, []);

  const maxCat = Math.max(...catStats.map(c => c.count), 1);
  const maxCity = Math.max(...cityStats.map(c => c.count), 1);
  const maxPkg = Math.max(...pkgStats.map(p => p.revenue), 1);

  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Ads" value={summary.total} icon={<BarChart2 className="w-5 h-5" />} color="blue" />
              <StatsCard label="Active Listings" value={summary.active} icon={<Activity className="w-5 h-5" />} color="green" />
              <StatsCard label="Approval Rate" value={`${summary.approvalRate}%`} icon={<CheckCircle className="w-5 h-5" />} color="teal" />
              <StatsCard label="Verified Revenue" value={`PKR ${summary.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="green" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Pending Review" value={summary.pending} icon={<Clock className="w-5 h-5" />} color="amber" />
              <StatsCard label="Expired Ads" value={summary.expired} icon={<XCircle className="w-5 h-5" />} color="red" />
              <StatsCard label="Flagged/Rejected" value={summary.flaggedAds} icon={<XCircle className="w-5 h-5" />} color="red" />
              <StatsCard label="Verified Payments" value={summary.verifiedPayments} icon={<CheckCircle className="w-5 h-5" />} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Moderation donut stats */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Moderation Overview
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Published', value: summary.active, color: 'bg-green-500', total: summary.total },
                    { label: 'Pending Review', value: summary.pending, color: 'bg-yellow-500', total: summary.total },
                    { label: 'Expired', value: summary.expired, color: 'bg-gray-400', total: summary.total },
                    { label: 'Rejected', value: summary.flaggedAds, color: 'bg-red-500', total: summary.total },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by package */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" /> Revenue by Package
                </h3>
                {pkgStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No revenue data yet</div>
                ) : (
                  <div className="space-y-3">
                    {pkgStats.map(pkg => (
                      <div key={pkg.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{pkg.name} ({pkg.count} ads)</span>
                          <span className="font-semibold text-gray-900">PKR {pkg.revenue.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(pkg.revenue / maxPkg) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ads by category */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Ads by Category
                </h3>
                {catStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No data</div>
                ) : (
                  <div className="space-y-2.5">
                    {catStats.map(c => (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 truncate flex-shrink-0">{c.name}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(c.count / maxCat) * 100}%` }}>
                            <span className="text-white text-xs font-bold">{c.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ads by city */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" /> Ads by City
                </h3>
                {cityStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No data</div>
                ) : (
                  <div className="space-y-2.5">
                    {cityStats.map(c => (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 truncate flex-shrink-0">{c.name}</span>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-400 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(c.count / maxCity) * 100}%` }}>
                            <span className="text-white text-xs font-bold">{c.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
