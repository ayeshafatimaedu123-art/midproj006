import { Router, Routes, Route, Navigate } from './lib/router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';

import HomePage from './pages/HomePage';
import ExploreAdsPage from './pages/ExploreAdsPage';
import AdDetailPage from './pages/AdDetailPage';
import PackagesPage from './pages/PackagesPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import CitiesPage from './pages/CitiesPage';
import CityPage from './pages/CityPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

import ClientDashboard from './pages/client/ClientDashboard';
import CreateAdPage from './pages/client/CreateAdPage';
import MyAdsPage from './pages/client/MyAdsPage';
import SubmitPaymentPage from './pages/client/SubmitPaymentPage';

import ModeratorDashboard from './pages/moderator/ModeratorDashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentQueuePage from './pages/admin/PaymentQueuePage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SystemHealthPage from './pages/admin/SystemHealthPage';
import UsersPage from './pages/admin/UsersPage';

import PackageManagementPage from './pages/superadmin/PackageManagementPage';

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExploreAdsPage />} />
      <Route path="/ads/:slug" element={<AdDetailPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/categories/:slug" element={<CategoryPage />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/cities/:slug" element={<CityPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

      <Route path="/dashboard" element={<RequireAuth><ClientDashboard /></RequireAuth>} />
      <Route path="/dashboard/create-ad" element={<RequireAuth><CreateAdPage /></RequireAuth>} />
      <Route path="/dashboard/edit-ad/:id" element={<RequireAuth><CreateAdPage /></RequireAuth>} />
      <Route path="/dashboard/my-ads" element={<RequireAuth><MyAdsPage /></RequireAuth>} />
      <Route path="/dashboard/payment/:adId" element={<RequireAuth><SubmitPaymentPage /></RequireAuth>} />

      <Route
        path="/moderator"
        element={<RequireAuth roles={['moderator', 'admin', 'super_admin']}><ModeratorDashboard /></RequireAuth>}
      />

      <Route
        path="/admin"
        element={<RequireAuth roles={['admin', 'super_admin']}><AdminDashboard /></RequireAuth>}
      />
      <Route
        path="/admin/payments"
        element={<RequireAuth roles={['admin', 'super_admin']}><PaymentQueuePage /></RequireAuth>}
      />
      <Route
        path="/admin/analytics"
        element={<RequireAuth roles={['admin', 'super_admin']}><AnalyticsPage /></RequireAuth>}
      />
      <Route
        path="/admin/health"
        element={<RequireAuth roles={['admin', 'super_admin']}><SystemHealthPage /></RequireAuth>}
      />
      <Route
        path="/admin/users"
        element={<RequireAuth roles={['admin', 'super_admin']}><UsersPage /></RequireAuth>}
      />

      <Route
        path="/superadmin/packages"
        element={<RequireAuth roles={['super_admin']}><PackageManagementPage /></RequireAuth>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
