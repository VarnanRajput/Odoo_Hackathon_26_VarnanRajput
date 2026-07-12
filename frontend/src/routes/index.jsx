import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layout
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Assets from '../pages/Assets';
import Allocations from '../pages/Allocations';
import Bookings from '../pages/Bookings';
import Maintenance from '../pages/Maintenance';
import Audits from '../pages/Audits';
import OrganizationSetup from '../pages/OrganizationSetup';
import ActivityLogs from '../pages/ActivityLogs';
import Reports from '../pages/Reports';
import Unauthorized from '../pages/Unauthorized';
import NotFound from '../pages/NotFound';
import Home from '../pages/Home';
import NotificationsPage from '../pages/Notifications';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Wrapper (Redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Home />} />

      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Private Dashboard Routes (Nested under DashboardLayout via pathless route) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="assets" element={<Assets />} />
        
        <Route path="allocations" element={<Allocations />} />
        
        <Route path="bookings" element={<Bookings />} />
        
        <Route path="maintenance" element={<Maintenance />} />
        
        <Route path="reports" element={<Reports />} />
        
        {/* Role-Restricted Pages */}
        <Route
          path="audits"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Asset Manager']}>
              <Audits />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="organization"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <OrganizationSetup />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="logs"
          element={
            <ProtectedRoute allowedRoles={['Admin', 'Asset Manager']}>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
        
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
export { ProtectedRoute, PublicRoute };
