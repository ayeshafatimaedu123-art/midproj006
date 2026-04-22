import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { CheckCircle, Star, Zap, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Package } from '../types';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('packages').select('*').eq('is_active', true).order('price')
      .then(({ data }) => { setPackages(data ?? []); setLoading(false); });
  }, []);

  const pkgConfig = [
    { color: 'border-gray-200', headerBg: 'bg-gray-50', icon: <Zap className="w-6 h-6 text-gray-600" />, badge: null },
    { color: 'border-blue-300', headerBg: 'bg-blue-600', icon: <TrendingUp className="w-6 h-6 text-white" />, badge: 'Popular' },
    { color: 'border-amber-300', headerBg: 'bg-amber-500', icon: <Star className="w-6 h-6 text-white fill-white" />, badge: 'Best Value' },
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-br from-blue-700 to-slate-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-black mb-3">Pricing Plans</h1>
            <p className="text-blue-200 text-lg">Choose the perfect plan to boost your listing visibility</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {packages.map((pkg, i) => {
                const cfg = pkgConfig[i] ?? pkgConfig[0];
                return (
                  <div key={pkg.id} className={`rounded-2xl border-2 overflow-hidden ${cfg.color} ${i === 2 ? 'shadow-xl scale-105' : 'shadow-sm'} bg-white`}>
                    {cfg.badge && (
                      <div className={`${cfg.headerBg} text-white text-center py-1 text-xs font-bold tracking-wider`}>
                        {cfg.badge}
                      </div>
                    )}
                    <div className={`${cfg.headerBg} p-6`}>
                      <div className={`w-12 h-12 rounded-xl ${i > 0 ? 'bg-white/20' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                        {cfg.icon}
                      </div>
                      <h2 className={`text-2xl font-black ${i > 0 ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h2>
                      <div className="mt-2">
                        <span className={`text-3xl font-black ${i > 0 ? 'text-white' : 'text-gray-900'}`}>
                          PKR {pkg.price.toLocaleString()}
                        </span>
                        <span className={`text-sm ml-1 ${i > 0 ? 'text-white/70' : 'text-gray-500'}`}>/ {pkg.duration_days} days</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-5">{pkg.description}</p>
                      <ul className="space-y-3 mb-6">
                        {[
                          `${pkg.duration_days}-day listing duration`,
                          pkg.homepage_visibility === 'homepage' ? 'Homepage featured placement' :
                            pkg.homepage_visibility === 'category' ? 'Category page priority' : 'Standard listing only',
                          `Featured weight: ${pkg.weight}x boost`,
                          pkg.refresh_rule === 'auto' ? 'Auto-refresh every 3 days' :
                            pkg.refresh_rule === 'manual' ? 'Manual refresh available' : 'No refresh option',
                          `Up to ${pkg.max_ads} concurrent ads`,
                          pkg.is_featured ? 'Appears in featured section' : 'Standard visibility',
                        ].map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/register"
                        className={`block w-full text-center py-3 rounded-xl font-bold text-sm transition ${
                          i === 1 ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                          i === 2 ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                          'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                      >
                        Choose {pkg.name}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How AdFlowPro Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Create Account', desc: 'Register and complete your seller profile' },
                { step: '2', title: 'Post Your Ad', desc: 'Fill in details, add media URLs, select a package' },
                { step: '3', title: 'Verification', desc: 'Our team reviews content & verifies payment' },
                { step: '4', title: 'Go Live', desc: 'Approved ads appear live for buyers to see' },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-black mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'How long does verification take?', a: 'Typically 24–48 hours for both content and payment verification.' },
                { q: 'Can I upgrade my package after posting?', a: 'Yes, contact support and pay the difference to upgrade your active listing.' },
                { q: 'What payment methods are accepted?', a: 'Bank transfer, Easypaisa, JazzCash. More methods coming soon.' },
                { q: 'What happens when my listing expires?', a: 'Your ad is hidden from public but saved. You can renew by selecting a new package.' },
                { q: 'Are media files stored on AdFlowPro?', a: 'No. We only store external URLs. You can use YouTube, GitHub, Cloudinary, or any public image URL.' },
              ].map(faq => (
                <div key={faq.q} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 text-sm pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
