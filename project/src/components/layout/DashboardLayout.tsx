import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from '../../lib/router';
import {
  LayoutDashboard, PlusCircle, FileText, Bell, Settings, LogOut,
  Menu, X, Zap, Shield, Eye, BarChart2, Activity, Users, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem { to: string; label: string; icon: ReactNode; roles?: string[] }

const allNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/dashboard/create-ad', label: 'Post New Ad', icon: <PlusCircle className="w-4 h-4" />, roles: ['client'] },
  { to: '/dashboard/my-ads', label: 'My Ads', icon: <FileText className="w-4 h-4" />, roles: ['client'] },
  { to: '/moderator', label: 'Review Queue', icon: <Eye className="w-4 h-4" />, roles: ['moderator', 'admin', 'super_admin'] },
  { to: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['admin', 'super_admin'] },
  { to: '/admin/payments', label: 'Payment Queue', icon: <FileText className="w-4 h-4" />, roles: ['admin', 'super_admin'] },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" />, roles: ['admin', 'super_admin'] },
  { to: '/admin/health', label: 'System Health', icon: <Activity className="w-4 h-4" />, roles: ['admin', 'super_admin'] },
  { to: '/admin/users', label: 'Manage Users', icon: <Users className="w-4 h-4" />, roles: ['admin', 'super_admin'] },
  { to: '/superadmin/packages', label: 'Packages', icon: <Package className="w-4 h-4" />, roles: ['super_admin'] },
  { to: '/profile', label: 'Profile Settings', icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(role ?? ''));

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const roleBadgeColor: Record<string, string> = {
    client: 'bg-blue-100 text-blue-700',
    moderator: 'bg-yellow-100 text-yellow-700',
    admin: 'bg-green-100 text-green-700',
    super_admin: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-lg text-gray-900">AdFlow<span className="text-blue-600">Pro</span></span>
          </Link>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[role ?? 'client'] ?? 'bg-gray-100 text-gray-700'}`}>
                {role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{title ?? 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600 hidden sm:block">
              View Site
            </Link>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
