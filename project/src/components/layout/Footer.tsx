import { Link } from '../../lib/router';
import { Zap, Mail, Phone, MapPin, Twitter, Facebook, Instagram, ArrowRight } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                AdFlow<span className="text-blue-400 font-black">Pro</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 mb-5 max-w-xs">
              Pakistan's trusted moderated ads marketplace. Post verified listings, reach real buyers, and sell faster.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:support@adflowpro.pk" className="flex items-center gap-2 hover:text-white transition-colors group">
                <Mail className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                support@adflowpro.pk
              </a>
              <a href="tel:+923000000000" className="flex items-center gap-2 hover:text-white transition-colors group">
                <Phone className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                +92 300 0000000
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-600" />
                Karachi, Pakistan
              </span>
            </div>
            <div className="flex items-center gap-2 mt-5">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  title={label}
                >
                  <Icon className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explore" className="hover:text-white transition-colors">Explore Ads</Link></li>
              <li><Link to="/packages" className="hover:text-white transition-colors">Packages</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Categories</Link></li>
              <li><Link to="/cities" className="hover:text-white transition-colors">Browse by City</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Dashboard</Link></li>
              <li><Link to="/dashboard/create-ad" className="hover:text-white transition-colors">Post an Ad</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-white font-semibold text-sm mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              Get tips on selling faster and new feature announcements.
            </p>
            <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-6">
              <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/60 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {year} AdFlowPro. All rights reserved. Built with React + Supabase.
          </p>
          <div className="flex items-center gap-1 text-xs">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-600">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
