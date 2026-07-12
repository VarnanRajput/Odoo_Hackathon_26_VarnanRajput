import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const NotificationsPage = () => {
  const { showNotification } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      showNotification('Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Helper to format relative time (e.g. 2m ago, 1h ago, 1d ago)
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  // Filter list by tab selection
  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Alerts') {
        return ['Overdue Return', 'Audit Discrepancy', 'General'].includes(n.type);
      }
      if (activeTab === 'Approvals') {
        return ['Transfer Requested', 'Transfer Approved', 'Maintenance Approved', 'Maintenance Rejected'].includes(n.type);
      }
      if (activeTab === 'Bookings') {
        return ['Booking Confirmed', 'Booking Cancelled'].includes(n.type);
      }
      return true;
    });
  };

  // Get color for indicator dot based on type/message content
  const getIndicatorColor = (type) => {
    if (['Asset Assigned', 'Booking Confirmed'].includes(type)) {
      return 'bg-sky-400 dark:bg-sky-500'; // light blue
    }
    if (['Maintenance Approved', 'Transfer Approved'].includes(type)) {
      return 'bg-emerald-400 dark:bg-emerald-500'; // green
    }
    if (['Overdue Return', 'Audit Discrepancy'].includes(type)) {
      return 'bg-rose-400 dark:bg-rose-500'; // orange / red
    }
    return 'bg-slate-400 dark:bg-slate-500'; // grey
  };

  const tabs = ['All', 'Alerts', 'Approvals', 'Bookings'];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Alerts & Notifications</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Review notifications, transfer approvals status updates, and bookings confirmations.
        </p>
      </div>

      {/* Main Card */}
      <Card className="flex flex-col gap-6">
        {/* Top button filter tabs as per Screen 10 */}
        <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Notifications list */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
          ) : getFilteredNotifications().length === 0 ? (
            <div className="text-center py-16 text-xs font-semibold text-slate-400">
              No notifications found in this category
            </div>
          ) : (
            getFilteredNotifications().map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.read && handleMarkRead(notif._id)}
                className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                  !notif.read
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 font-semibold cursor-pointer'
                    : 'border-slate-100 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/10 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Color coded circle indicator matching Screen 10 */}
                  <div className={`h-3 w-3 rounded-full shrink-0 ${getIndicatorColor(notif.type)}`} />
                  <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate pr-4">
                    {notif.message}
                  </span>
                </div>
                
                <span className="text-[10px] font-bold text-slate-400 shrink-0 select-none ml-2">
                  {getRelativeTime(notif.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationsPage;
export { NotificationsPage };
