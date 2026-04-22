import { useEffect, useState } from 'react';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Package as PkgType } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PackageManagementPage() {
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    supabase.from('packages').select('*').order('price')
      .then(({ data }) => { setPackages(data ?? []); setLoading(false); });
  }, []);

  const updatePackage = async (pkg: PkgType) => {
    setSaving(pkg.id);
    await supabase.from('packages').update({
      name: pkg.name, price: pkg.price, duration_days: pkg.duration_days,
      weight: pkg.weight, max_ads: pkg.max_ads, is_active: pkg.is_active,
      description: pkg.description,
    }).eq('id', pkg.id);
    setSuccess(pkg.id);
    setSaving(null);
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateField = (id: string, field: keyof PkgType, value: unknown) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <DashboardLayout title="Package Management">
      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-lg">{pkg.name} Package</h3>
                {success === pkg.id && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={pkg.name} onChange={e => updateField(pkg.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price (PKR)</label>
                  <input type="number" value={pkg.price} onChange={e => updateField(pkg.id, 'price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Duration (days)</label>
                  <input type="number" value={pkg.duration_days} onChange={e => updateField(pkg.id, 'duration_days', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Feature Weight</label>
                  <input type="number" value={pkg.weight} onChange={e => updateField(pkg.id, 'weight', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Concurrent Ads</label>
                  <input type="number" value={pkg.max_ads} onChange={e => updateField(pkg.id, 'max_ads', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={pkg.is_active}
                      onChange={e => updateField(pkg.id, 'is_active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={pkg.description} onChange={e => updateField(pkg.id, 'description', e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => updatePackage(pkg)}
                  disabled={saving === pkg.id}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
                >
                  {saving === pkg.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
