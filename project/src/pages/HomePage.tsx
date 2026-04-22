import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from '../lib/router';
import {
  Search, Star, Shield, Clock, TrendingUp, ChevronRight, CheckCircle,
  HelpCircle, Zap, Users, BarChart3, ArrowRight, FileText, Eye, BadgeCheck,
  Rocket, Tag, MapPin, RefreshCw, Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad, Package as AdPackage, Category, LearningQuestion } from '../types';
import AdCard from '../components/common/AdCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/layout/Layout';

const STATS = [
  { label: 'Active Listings', value: '12,400+', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Verified Sellers', value: '4,800+', icon: BadgeCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Monthly Visitors', value: '120K+', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Cities Covered', value: '15+', icon: MapPin, color: 'text-red-500', bg: 'bg-red-50' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Ad',
    desc: 'Write a compelling listing with photos and a fair price. Our guided form makes it quick and easy.',
    icon: FileText,
    color: 'bg-blue-600',
  },
  {
    step: '02',
    title: 'Get Reviewed',
    desc: 'Our moderation team verifies your ad within 24 hours to ensure quality and prevent spam.',
    icon: Shield,
    color: 'bg-slate-700',
  },
  {
    step: '03',
    title: 'Choose a Package',
    desc: 'Select Basic, Standard, or Premium for maximum visibility and rank-boosted placements.',
    icon: Package,
    color: 'bg-amber-500',
  },
  {
    step: '04',
    title: 'Go Live & Sell',
    desc: 'Your ad goes live, reaches thousands of verified buyers, and starts generating inquiries.',
    icon: Rocket,
    color: 'bg-green-600',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ahmed Raza',
    city: 'Karachi',
    role: 'Electronics Seller',
    text: 'Sold my laptop in 2 days with the Premium package. The moderation made buyers trust my listing instantly.',
    avatar: 'AR',
    rating: 5,
  },
  {
    name: 'Sana Malik',
    city: 'Lahore',
    role: 'Property Agent',
    text: 'AdFlowPro is perfect for real estate. The rank system keeps my listings at the top without any tricks.',
    avatar: 'SM',
    rating: 5,
  },
  {
    name: 'Usman Khan',
    city: 'Islamabad',
    role: 'Car Dealer',
    text: "The Standard package gave me excellent ROI. I've been using it every month for my vehicle listings.",
    avatar: 'UK',
    rating: 5,
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: '📱',
  Vehicles: '🚗',
  'Real Estate': '🏠',
  Jobs: '💼',
  Fashion: '👗',
  Furniture: '🪑',
  Services: '🔧',
  Education: '📚',
  Sports: '⚽',
  Agriculture: '🌾',
  Books: '📖',
  Pets: '🐾',
};

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1200;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(target);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [question, setQuestion] = useState<LearningQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [adsRes, pkgRes, catRes, qRes] = await Promise.all([
        supabase
          .from('ads')
          .select('*, packages(*), categories(*), cities(*), ad_media(*)')
          .eq('status', 'published')
          .order('rank_score', { ascending: false })
          .limit(12),
        supabase.from('packages').select('*').eq('is_active', true).order('price'),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(8),
        supabase.from('learning_questions').select('*').eq('is_active', true).limit(50),
      ]);

      const all = adsRes.data ?? [];
      setFeaturedAds(all.filter(a => a.is_featured).slice(0, 4));
      setRecentAds(all.slice(0, 8));
      setPackages(pkgRes.data ?? []);
      setCategories(catRes.data ?? []);

      const qs = qRes.data ?? [];
      if (qs.length > 0) setQuestion(qs[Math.floor(Math.random() * qs.length)]);
      setLoading(false);
    }
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const pkgHighlight = [false, false, true];
  const pkgAccents = [
    { badge: 'bg-slate-100 text-slate-600', btn: 'bg-slate-800 hover:bg-slate-700 text-white', border: 'border-gray-200' },
    { badge: 'bg-blue-100 text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700 text-white', border: 'border-blue-200' },
    { badge: 'bg-amber-100 text-amber-700', btn: 'bg-amber-500 hover:bg-amber-600 text-white', border: 'border-amber-300' },
  ];

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #1e3a8a 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-slate-600/20 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 text-sm mb-6">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Pakistan's #1 Moderated Ads Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5">
            Post Smarter.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-400">
              Sell Faster.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Verified listings, expert moderation, and rank-based placements — your ads reach the right buyers.
          </p>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cars, phones, jobs..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-900/30"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            {['Moderated Content', 'Payment Verified', 'Spam-Free'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                {t}
              </span>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/explore" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <Eye className="w-4 h-4" />
              Browse Ads
            </Link>
            <Link to="/register" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors">
              Post Free Ad
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ─────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: <Shield className="w-4 h-4 text-blue-600" />, title: 'Verified Sellers', desc: 'All accounts reviewed' },
              { icon: <Star className="w-4 h-4 text-amber-500" />, title: 'Featured Placements', desc: 'Premium visibility' },
              { icon: <Clock className="w-4 h-4 text-green-600" />, title: 'Package Durations', desc: '7, 15, 30-day plans' },
              { icon: <TrendingUp className="w-4 h-4 text-red-500" />, title: 'Rank-Based Results', desc: 'Best ads first' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-2.5 p-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-xs text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
              <p className="text-gray-500 text-sm mt-1">Find what you're looking for, fast</p>
            </div>
            <Link to="/categories" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
              All categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-200">
                  <span className="text-2xl">{CATEGORY_ICONS[cat.name] ?? '📦'}</span>
                </div>
                <p className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Ads ──────────────────────────────────────────── */}
      {(loading || featuredAds.length > 0) && (
        <section className="py-14 bg-gradient-to-b from-amber-50/60 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-7">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Featured Ads</h2>
                </div>
                <p className="text-gray-500 text-sm">Premium placements with maximum visibility</p>
              </div>
              <Link to="/explore?featured=true" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><LoadingSpinner /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Latest Listings ───────────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Latest Listings</h2>
              <p className="text-gray-500 text-sm mt-1">Freshest ads posted today</p>
            </div>
            <Link to="/explore" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
              Browse all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : recentAds.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold">No listings yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to post an ad!</p>
              <Link to="/register" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                Post Your Ad
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">How AdFlowPro Works</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">From listing to sale in 4 easy steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%-12px)] w-full h-px bg-gray-200 z-0" />
                )}
                <div className="relative z-10 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-bold text-gray-300 mb-1 tracking-widest">STEP {step.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Packages ──────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Pricing</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Simple, Transparent Pricing</h2>
            <p className="text-gray-500 mt-2">Pick the package that fits your goals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {packages.map((pkg, i) => {
              const accent = pkgAccents[i] ?? pkgAccents[0];
              const highlight = pkgHighlight[i] ?? false;
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl border-2 p-6 bg-white transition-all duration-200 ${
                    highlight
                      ? 'border-amber-300 shadow-xl scale-[1.02]'
                      : `${accent.border} shadow-sm hover:shadow-md`
                  }`}
                >
                  {highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      BEST VALUE
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${accent.badge}`}>
                      {pkg.duration_days}d
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-black text-gray-900">PKR {pkg.price.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm ml-1">/ {pkg.duration_days} days</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{pkg.description}</p>
                  <ul className="space-y-2.5 mb-6">
                    {[
                      { icon: Clock, text: `${pkg.duration_days}-day active listing` },
                      { icon: Eye, text: pkg.homepage_visibility === 'homepage' ? 'Homepage featured slot' : pkg.homepage_visibility === 'category' ? 'Category priority placement' : 'Standard listing' },
                      { icon: RefreshCw, text: pkg.refresh_rule === 'auto' ? 'Auto-refresh every 3 days' : pkg.refresh_rule === 'manual' ? 'Manual refresh anytime' : 'No refresh' },
                      { icon: Tag, text: `Up to ${pkg.max_ads} active ads` },
                    ].map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <feat.icon className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        {feat.text}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${accent.btn}`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            All packages include moderation & spam protection.{' '}
            <Link to="/packages" className="text-blue-600 hover:underline font-medium">Compare in detail</Link>
          </p>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Trusted by Thousands of Sellers</h2>
            <p className="text-gray-500 mt-2">Real results from real Pakistani sellers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #1e3a8a 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Ready to Sell Smarter?
          </h2>
          <p className="text-slate-300 mb-7 max-w-lg mx-auto">
            Join 4,800+ verified sellers already growing their business on AdFlowPro. Your first listing is always free.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl text-sm hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/explore"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl text-sm hover:bg-white/15 transition-colors border border-white/20"
            >
              <Eye className="w-4 h-4" />
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      {/* ── Daily Learning Quiz ───────────────────────────────────── */}
      {question && (
        <section className="py-14 bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Daily Quiz</span>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  question.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                  question.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {question.difficulty}
                </span>
                <span className="text-xs text-gray-400 font-medium">{question.topic}</span>
              </div>

              <p className="text-gray-900 font-semibold text-base mb-6 leading-relaxed">{question.question}</p>

              {showAnswer ? (
                <div className="bg-blue-50 rounded-xl p-4 text-left border border-blue-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{question.answer}</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Reveal Answer
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
