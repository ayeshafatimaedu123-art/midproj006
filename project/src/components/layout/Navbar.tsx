import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from '../../lib/router';
import { Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard, Zap, Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../types';

export default function Navbar() {
  const { user, signOut, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => setNotifications(data ?? []));
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashboardPath = () => {
    if (role === 'moderator') return '/moderator';
    if (role === 'admin' || role === 'super_admin') return '/admin';
    return '/dashboard';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications([]);
    setNotifOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/explore', label: 'Explore' },
    { to: '/packages', label: 'Packages' },
    { to: '/categories', label: 'Categories' },
    { to: '/cities', label: 'Cities' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent'
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
              AdFlow<span className={`font-black ${isTransparent ? 'text-blue-300' : 'text-blue-600'}`}>Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  location.pathname === link.to
                    ? isTransparent
                      ? 'text-white bg-white/10'
                      : 'text-blue-600 bg-blue-50'
                    : isTransparent
                    ? 'text-white/75 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/explore"
                  className={`hidden sm:flex items-center gap-1.5 p-2 rounded-lg transition-all duration-150 ${
                    isTransparent ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Search ads"
                >
                  <Search className="w-4 h-4" />
                </Link>

                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
                    className={`relative p-2 rounded-lg transition-all duration-150 ${
                      isTransparent ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                          {notifications.length > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                              {notifications.length}
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-medium">
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">All caught up!</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/dashboard/create-ad"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-150 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Ad
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-150 ${
                      isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${isTransparent ? 'text-white/90' : 'text-gray-700'}`}>
                      {user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${isTransparent ? 'text-white/50' : 'text-gray-400'}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{role}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to={dashboardPath()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          My Profile
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 w-full text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
                    isTransparent
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Ad
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-150 ${
                isTransparent ? 'text-white/80 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  location.pathname === link.to ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard/create-ad"
                onClick={() => setMenuOpen(false)}
                className="block mx-4 mt-2 mb-1 px-4 py-2.5 text-sm font-semibold text-center bg-blue-600 text-white rounded-xl"
              >
                Post New Ad
              </Link>
            ) : (
              <div className="flex gap-2 px-4 mt-2 mb-1">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-center border border-gray-200 rounded-xl text-gray-700">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 text-sm font-semibold text-center bg-blue-600 text-white rounded-xl">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
