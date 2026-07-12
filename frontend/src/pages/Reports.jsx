import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import api from '../services/api';

const Reports = () => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, allocsRes, booksRes, maintRes] = await Promise.all([
        api.get('/assets'),
        api.get('/allocations'),
        api.get('/bookings'),
        api.get('/maintenance')
      ]);

      setAssets(assetsRes.data.data || []);
      setAllocations(allocsRes.data.data || []);
      setBookings(booksRes.data.data || []);
      setMaintenance(maintRes.data.data || []);
    } catch (err) {
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Export report helper
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Category,Utilization Metrics,Most Used Vs Idle\r\n";
      csvContent += "Room B2,34 bookings,Most Used\r\n";
      csvContent += "Van AF-343,21 trips,Most Used\r\n";
      csvContent += "Projector AF-335,18 uses,Most Used\r\n";
      csvContent += "Camera AF-0301,unused 60+ days,Idle\r\n";
      csvContent += "Chair AF-0410,unused 45 days,Idle\r\n";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `AssetFlow_Discrepancy_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Report exported successfully', 'success');
    } catch (err) {
      showNotification('Export failed', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Utilization statistics, maintenance frequencies, and idle/retirement tracking.
        </p>
      </div>

      {/* DUAL SVG PANELS (Screen 9 Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        
        {/* Left Panel: Utilization by Department (Yellow Vertical Bars) */}
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-3 min-h-[260px]">
          <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
            Utilization by department
          </span>
          
          <div className="flex-1 flex gap-4 pt-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-sky-700/60 dark:text-sky-400/60 h-28 pb-2 pt-6 shrink-0 select-none text-right w-8">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>

            {/* Bars container */}
            <div className="flex-1 flex flex-col relative">
              {/* Background Grid Ticks (Grid Lines structure) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 pt-6">
                <div className="border-t border-sky-500/10 w-full" />
                <div className="border-t border-sky-500/10 w-full" />
                <div className="border-t border-sky-500/10 w-full" />
              </div>

              <div className="flex-1 flex items-end justify-between px-4 pb-2 border-b border-sky-500/10 pt-6 h-28 relative z-10">
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '50px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">IT</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '90px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">HR</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '110px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">ENG</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '70px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">MKT</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '40px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">FIN</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 w-[12%]">
                  <div className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-md shadow-sm" style={{ height: '95px' }} />
                  <span className="text-[8px] font-bold text-sky-700 dark:text-sky-400">OPS</span>
                </div>
              </div>
              
              {/* X-Axis Tag */}
              <div className="text-center text-[9px] font-extrabold text-sky-700/80 dark:text-sky-400/80 mt-2 uppercase tracking-wide">
                Departments
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Maintenance Frequency (Red Line Chart) */}
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-3 min-h-[260px]">
          <span className="text-xs font-extrabold text-sky-800 dark:text-sky-300 uppercase tracking-wide">
            Maintenance Frequency
          </span>

          <div className="flex-1 flex gap-4 pt-4">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-sky-700/60 dark:text-sky-400/60 h-28 pb-2 pt-6 shrink-0 select-none text-right w-8">
              <span>20 Rpr</span>
              <span>10 Rpr</span>
              <span>0 Rpr</span>
            </div>

            {/* Line Graph container */}
            <div className="flex-1 flex flex-col relative">
              {/* Background Grid Ticks (Grid Lines structure) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 pt-6">
                <div className="border-t border-sky-500/10 w-full" />
                <div className="border-t border-sky-500/10 w-full" />
                <div className="border-t border-sky-500/10 w-full" />
              </div>

              <div className="flex-1 relative flex items-end border-b border-sky-500/10 h-28 pt-6 pb-2 z-10">
                {/* Draw custom SVG red line graph */}
                <svg className="w-full h-20 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                  {/* SVG Red Line graph */}
                  <path
                    d="M 5,40 L 25,25 L 45,35 L 65,15 L 85,10 M 85,10"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Drop Dots */}
                  <circle cx="5" cy="40" r="1.5" fill="#f43f5e" />
                  <circle cx="25" cy="25" r="1.5" fill="#f43f5e" />
                  <circle cx="45" cy="35" r="1.5" fill="#f43f5e" />
                  <circle cx="65" cy="15" r="1.5" fill="#f43f5e" />
                  <circle cx="85" cy="10" r="1.5" fill="#f43f5e" />
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between px-2 text-[8px] font-bold text-sky-700/60 dark:text-sky-400/60 mt-1 select-none">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
              </div>

              {/* X-Axis Tag */}
              <div className="text-center text-[9px] font-extrabold text-sky-700/80 dark:text-sky-400/80 mt-1 uppercase tracking-wide">
                Months
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS & LISTS DETAIL SECTION (Screen 9 Layout) */}
      <Card className="flex flex-col gap-6">
        
        {/* Most Used & Idle side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          {/* Most Used Column */}
          <div className="flex flex-col gap-3">
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight uppercase">
              Most used assets
            </h5>
            <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-col gap-2.5 list-disc pl-4">
              <li>Conference Room B2: <b className="text-indigo-500">34 bookings</b> this month</li>
              <li>Van AF-343: <b className="text-indigo-500">21 trips</b> this month</li>
              <li>Projector AF-335: <b className="text-indigo-500">18 uses</b></li>
            </ul>
          </div>

          {/* Idle Column */}
          <div className="flex flex-col gap-3">
            <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight uppercase">
              Idle assets
            </h5>
            <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-col gap-2.5 list-disc pl-4">
              <li>Camera AF-0301: <span className="text-rose-400 font-bold">unused 60+ days</span></li>
              <li>Chair AF-0410: <span className="text-rose-400 font-bold">unused 45 days</span></li>
            </ul>
          </div>
        </div>

        {/* Maintenance / Retirement section */}
        <div className="flex flex-col gap-3">
          <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight uppercase">
            Assets due for maintenance / nearing retirement
          </h5>
          <ul className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-col gap-2.5 list-disc pl-4">
            <li>Forklift AF-0087: <span className="text-amber-500 font-bold">service due in 5 days</span></li>
            <li>Laptop AF-0020: <span className="text-amber-500 font-bold">4 years old: nearing retirement</span></li>
          </ul>
        </div>

        {/* Export Report Action */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-start">
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
          >
            Export report
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
export { Reports };
