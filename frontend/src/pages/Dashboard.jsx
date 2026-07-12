import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StatsCard from '../components/cards/StatsCard';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    available: 0,
    allocated: 0,
    maintenance: 0,
    bookings: 0,
    transfers: 0,
    overdue: 0,
    upcomingReturns: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load raw listings in parallel to calculate stats dynamically
      const [assetsRes, allocsRes, booksRes, maintRes, logsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/allocations'),
        api.get('/bookings'),
        api.get('/maintenance'),
        api.get('/logs').catch(() => ({ data: { data: [] } })) // gracefully handle if standard employee has no access to logs
      ]);

      const assets = assetsRes.data.data || [];
      const allocations = allocsRes.data.data || [];
      const bookings = booksRes.data.data || [];
      const maintenanceList = maintRes.data.data || [];
      const logs = logsRes.data.data || [];

      // Calculate stats
      const available = assets.filter(a => a.status === 'Available').length;
      const allocated = assets.filter(a => a.status === 'Allocated').length;
      const maintenance = maintenanceList.filter(m => ['Approved', 'In Progress'].includes(m.status)).length;
      const activeBookings = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
      
      // Calculate returns (overdue vs upcoming)
      let overdue = 0;
      let upcomingReturns = 0;
      const today = new Date();

      allocations.forEach(alloc => {
        if (alloc.status === 'Active' && alloc.expectedReturnDate) {
          const expDate = new Date(alloc.expectedReturnDate);
          if (expDate < today) {
            overdue++;
          } else {
            upcomingReturns++;
          }
        }
      });

      setStats({
        available,
        allocated,
        maintenance,
        bookings: activeBookings,
        transfers: allocations.filter(a => a.status === 'Requested').length, // pending transfers count placeholder
        overdue,
        upcomingReturns
      });

      setRecentActivities(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Welcome back, <b>{user?.name}</b>! Here is your real-time operational snapshot.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          📅 {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Assets Available"
          value={stats.available}
          subtext="Ready for allocation"
          icon={() => <span>✅</span>}
          iconBg="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard
          title="Assets Allocated"
          value={stats.allocated}
          subtext="Currently checked out"
          icon={() => <span>🔄</span>}
          iconBg="bg-indigo-500/10 text-indigo-500"
        />
        <StatsCard
          title="Active Bookings"
          value={stats.bookings}
          subtext="Shared resources slots"
          icon={() => <span>📅</span>}
          iconBg="bg-sky-500/10 text-sky-500"
        />
        <StatsCard
          title="Maintenance Tickets"
          value={stats.maintenance}
          subtext="Under active repair"
          icon={() => <span>🔧</span>}
          iconBg="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Overdue Highlights Banner */}
      {stats.overdue > 0 && (
        <Card className="border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h5 className="font-bold text-sm text-rose-600 dark:text-rose-400">Critical Overdue Returns Alert</h5>
              <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5">
                There are <b>{stats.overdue}</b> asset allocations that have passed their expected return date.
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => navigate('/allocations?filter=overdue')}>
            View Overdue Allocations
          </Button>
        </Card>
      )}

      {/* Main Content Dashboard Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Custom SVG Charts Placeholder & Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Custom SVG Charts */}
          <Card className="flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Asset Utilization Trends</h4>
              <p className="text-xs text-slate-400 mt-0.5">Operational allocation breakdown by category</p>
            </div>
            
            {/* Custom Interactive SVG Chart */}
            <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-slate-200 dark:border-slate-800 pt-8 relative select-none">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[9px] font-bold text-slate-400">
                <div className="border-b border-dashed border-current w-full pb-1">100%</div>
                <div className="border-b border-dashed border-current w-full pb-1">75%</div>
                <div className="border-b border-dashed border-current w-full pb-1">50%</div>
                <div className="border-b border-dashed border-current w-full pb-1">25%</div>
                <div>0%</div>
              </div>

              {/* Bar 1 */}
              <div className="flex flex-col items-center gap-2 w-1/4 group z-10 cursor-pointer">
                <div className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">85%</div>
                <div className="w-12 bg-indigo-500 dark:bg-indigo-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md shadow-indigo-500/20" style={{ height: '160px' }} />
                <span className="text-xs font-semibold text-slate-500">Electronics</span>
              </div>
              {/* Bar 2 */}
              <div className="flex flex-col items-center gap-2 w-1/4 group z-10 cursor-pointer">
                <div className="text-[10px] font-bold text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">60%</div>
                <div className="w-12 bg-sky-500 dark:bg-sky-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md shadow-sky-500/20" style={{ height: '115px' }} />
                <span className="text-xs font-semibold text-slate-500">Furniture</span>
              </div>
              {/* Bar 3 */}
              <div className="flex flex-col items-center gap-2 w-1/4 group z-10 cursor-pointer">
                <div className="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">45%</div>
                <div className="w-12 bg-emerald-500 dark:bg-emerald-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md shadow-emerald-500/20" style={{ height: '85px' }} />
                <span className="text-xs font-semibold text-slate-500">Vehicles</span>
              </div>
              {/* Bar 4 */}
              <div className="flex flex-col items-center gap-2 w-1/4 group z-10 cursor-pointer">
                <div className="text-[10px] font-bold text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">70%</div>
                <div className="w-12 bg-purple-500 dark:bg-purple-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md shadow-purple-500/20" style={{ height: '130px' }} />
                <span className="text-xs font-semibold text-slate-500">Other Shared</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Shortcuts */}
          <Card>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Operations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="justify-start py-3 px-4 flex flex-col items-start gap-1"
                onClick={() => navigate('/assets')}
              >
                <span className="text-lg">📁</span>
                <span className="font-bold text-xs mt-1">Register Asset</span>
              </Button>
              
              <Button
                variant="outline"
                className="justify-start py-3 px-4 flex flex-col items-start gap-1"
                onClick={() => navigate('/bookings')}
              >
                <span className="text-lg">📅</span>
                <span className="font-bold text-xs mt-1">Book Resource</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start py-3 px-4 flex flex-col items-start gap-1"
                onClick={() => navigate('/maintenance')}
              >
                <span className="text-lg">🔧</span>
                <span className="font-bold text-xs mt-1">Raise Repair Ticket</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Col: Recent Activities */}
        <Card className="h-full flex flex-col">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Recent System Logs</h4>
          
          <div className="flex-1 flex flex-col gap-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 font-semibold">
                No recent activity logs recorded
              </div>
            ) : (
              recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 text-xs leading-normal pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0">
                    ℹ️
                  </div>
                  <div>
                    <span className="font-bold block text-[var(--text-primary)]">{act.action}</span>
                    <p className="text-slate-500 mt-0.5">{act.details}</p>
                    <span className="text-[10px] opacity-40 mt-1 block">
                      {new Date(act.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
