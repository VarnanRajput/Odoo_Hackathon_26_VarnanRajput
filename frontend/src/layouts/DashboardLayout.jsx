import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

const DashboardLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications periodically
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      showNotification('All marked as read', 'success');
      fetchNotifications();
      setNotifDropdownOpen(false);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    showNotification('Logged out successfully', 'success');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Assets Directory', path: '/assets', icon: '📁', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Allocations & Transfers', path: '/allocations', icon: '🔄', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Resource Booking', path: '/bookings', icon: '📅', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Maintenance requests', path: '/maintenance', icon: '🔧', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Reports & Analytics', path: '/reports', icon: '📈', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { label: 'Physical Audits', path: '/audits', icon: '🔍', roles: ['Admin', 'Asset Manager'] },
    { label: 'Organization Setup', path: '/organization', icon: '⚙️', roles: ['Admin'] },
    { label: 'System Logs', path: '/logs', icon: '📜', roles: ['Admin', 'Asset Manager'] },
    { label: 'Notifications', path: '/notifications', icon: '🔔', roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] }
  ];

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  // Breadcrumbs builder
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return ['Home'];
    return ['Home', ...paths.map(p => p.charAt(0).toUpperCase() + p.slice(1))];
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 flex">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] shrink-0 select-none">
        {/* Brand Logo Header */}
        <div className="h-16 px-6 border-b border-[var(--border-color)] flex items-center gap-2 shrink-0">
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent tracking-tight">
            AssetFlow
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 uppercase">
            ERP
          </span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {filteredNavItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile shortcut */}
        <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
            {user ? user.name[0] : '?'}
          </div>
          <div className="overflow-hidden">
            <h6 className="text-xs font-bold leading-tight truncate">{user ? user.name : 'User'}</h6>
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">{user ? user.role : 'Employee'}</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* TOP NAVBAR */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 flex justify-between items-center shrink-0 z-50">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
            >
              ☰
            </button>
            
            {/* Breadcrumb Display */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              {getBreadcrumbs().map((b, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="opacity-40">/</span>}
                  <span className={idx === getBreadcrumbs().length - 1 ? 'text-[var(--text-primary)]' : ''}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right: Theme Toggle + Notifications + Profile Dropdown */}
          <div className="flex items-center gap-2">
            {/* A. Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* B. Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 relative cursor-pointer"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50 animate-slide-up">
                  <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
                    <h5 className="font-bold text-sm">Notifications</h5>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id}
                          onClick={() => handleMarkAsRead(notif._id)}
                          className={`p-4 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer ${
                            !notif.read ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-[var(--text-primary)]">{notif.title}</span>
                            {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                          </div>
                          <p className="text-[var(--text-secondary)] leading-normal">{notif.message}</p>
                          <span className="text-[10px] opacity-40 mt-1 block">
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* C. User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                  {user ? user.name[0] : '?'}
                </div>
                <span className="hidden sm:inline text-xs font-bold">{user ? user.name.split(' ')[0] : 'User'}</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--border-color)] bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50 animate-slide-up">
                  <div className="p-4 border-b border-[var(--border-color)] bg-slate-50 dark:bg-slate-900/40">
                    <h6 className="text-xs font-bold leading-tight truncate">{user ? user.name : 'User'}</h6>
                    <span className="text-[10px] text-[var(--text-secondary)] truncate block">{user ? user.email : ''}</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* INNER SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto slide-up">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="h-12 shrink-0 border-t border-[var(--border-color)] px-6 flex items-center justify-between text-[10px] font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)]">
          <span>&copy; {new Date().getFullYear()} AssetFlow ERP System.</span>
          <span>Made for Odoo Hackathon.</span>
        </footer>
      </div>

      {/* 3. MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-105 lg:hidden flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          <aside className="relative w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col animate-fade-in z-10">
            <div className="h-16 px-6 border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
              <span className="text-lg font-extrabold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent">
                AssetFlow
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded text-xs font-bold cursor-pointer text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
              {filteredNavItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
                {user ? user.name[0] : '?'}
              </div>
              <div className="overflow-hidden">
                <h6 className="text-xs font-bold leading-tight truncate">{user ? user.name : 'User'}</h6>
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{user ? user.role : 'Employee'}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
