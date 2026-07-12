import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Table from '../components/tables/Table';
import api from '../services/api';

const Reports = () => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, allocsRes, maintRes, booksRes, deptsRes, catsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/allocations'),
        api.get('/bookings'),
        api.get('/maintenance'),
        api.get('/departments'),
        api.get('/categories')
      ]);

      setAssets(assetsRes.data.data || []);
      setAllocations(allocsRes.data.data || []);
      setMaintenance(maintRes.data.data || []);
      setBookings(booksRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch (err) {
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const getDeptSummary = () => {
    return departments.map(dept => {
      const activeAlloc = allocations.filter(a => a.assignedDepartment === dept._id && a.status === 'Active').length;
      const totalAllocs = allocations.filter(a => a.assignedDepartment === dept._id).length;
      return {
        _id: dept._id,
        name: dept.name,
        activeAlloc,
        totalAllocs
      };
    });
  };

  const getAssetsNearingService = () => {
    // Show assets with poor condition or those that have resolved/active maintenance records
    return assets.filter(a => ['Poor', 'Damaged'].includes(a.condition) || a.status === 'Under Maintenance');
  };

  // Export report to CSV helper
  const handleExportCSV = (reportName, dataHeaders, dataRows) => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += dataHeaders.join(",") + "\r\n";
      
      // Rows
      dataRows.forEach(row => {
        csvContent += row.join(",") + "\r\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Report exported successfully', 'success');
    } catch (err) {
      showNotification('Export failed', 'error');
    }
  };

  // SVG Heatmap Matrix: Weekday (Mon-Fri) vs Hour Slots (9am, 11am, 1pm, 3pm, 5pm)
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00'];
  
  // Randomly generate density index for mockup visuals (realistic heatmap)
  const getHeatmapDensity = (day, hour) => {
    const code = (day.charCodeAt(0) + hour.charCodeAt(1)) % 5;
    const densities = [
      'bg-slate-100 dark:bg-slate-800 text-slate-400', // empty
      'bg-indigo-500/10 text-indigo-400', // low
      'bg-indigo-500/30 text-indigo-500', // mid
      'bg-indigo-500/60 text-white font-bold', // high
      'bg-indigo-600 text-white font-bold' // peak
    ];
    return densities[code];
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Analyze asset utilization, department statistics, repair frequencies, and shared booking heatmaps.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            handleExportCSV(
              'asset_utilization_report',
              ['Asset Tag', 'Asset Name', 'Status', 'Location'],
              assets.map(a => [a.assetTag, a.name, a.status, a.location])
            )
          }
          disabled={assets.length === 0}
        >
          📥 Export Inventory CSV
        </Button>
      </div>

      {/* Analytics Charts & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG Utilization Bar Chart */}
        <Card className="flex flex-col gap-4">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
              Maintenance Frequencies
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Total repair request counts by category</p>
          </div>
          
          <div className="h-64 flex items-end justify-between px-6 pb-2 border-b border-slate-200 dark:border-slate-800 pt-8 relative select-none">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[9px] font-bold text-slate-400">
              <div className="border-b border-dashed border-current w-full pb-1">15 Repairs</div>
              <div className="border-b border-dashed border-current w-full pb-1">10 Repairs</div>
              <div className="border-b border-dashed border-current w-full pb-1">5 Repairs</div>
              <div>0</div>
            </div>

            {/* Bars */}
            <div className="flex flex-col items-center gap-2 w-1/3 group z-10 cursor-pointer">
              <div className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">8 tickets</div>
              <div className="w-12 bg-indigo-500 dark:bg-indigo-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md" style={{ height: '90px' }} />
              <span className="text-xs font-semibold text-slate-500">Electronics</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 w-1/3 group z-10 cursor-pointer">
              <div className="text-[10px] font-bold text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">2 tickets</div>
              <div className="w-12 bg-sky-500 dark:bg-sky-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md" style={{ height: '25px' }} />
              <span className="text-xs font-semibold text-slate-500">Furniture</span>
            </div>

            <div className="flex flex-col items-center gap-2 w-1/3 group z-10 cursor-pointer">
              <div className="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">5 tickets</div>
              <div className="w-12 bg-emerald-500 dark:bg-emerald-600 rounded-t-xl group-hover:scale-y-105 origin-bottom transition-all duration-300 shadow-md" style={{ height: '60px' }} />
              <span className="text-xs font-semibold text-slate-500">Vehicles</span>
            </div>
          </div>
        </Card>

        {/* Resource Booking Heatmap Grid */}
        <Card className="flex flex-col gap-4">
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
              Resource Booking Heatmap
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Peak bookable usage windows (Hour vs Weekday)</p>
          </div>

          <div className="flex-1 flex flex-col gap-2 mt-4">
            {/* Header row for Time Slots */}
            <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold text-slate-400 select-none pb-1 border-b border-slate-100 dark:border-slate-850">
              <div className="text-left pl-2">Day</div>
              {timeSlots.map((slot, idx) => <div key={idx}>{slot}</div>)}
            </div>

            {/* Heatmap Grid Density Cells */}
            {weekdays.map((day, dIdx) => (
              <div key={dIdx} className="grid grid-cols-6 gap-2 items-center text-center">
                <div className="text-xs font-bold text-slate-500 text-left pl-2 select-none">{day}</div>
                {timeSlots.map((hour, hIdx) => {
                  const densityClass = getHeatmapDensity(day, hour);
                  return (
                    <div
                      key={hIdx}
                      className={`heatmap-cell p-2 rounded-lg text-[9px] font-semibold flex items-center justify-center transition-all ${densityClass}`}
                      title={`${day} @ ${hour} slot density`}
                    >
                      {Math.round((day.charCodeAt(0) + hour.charCodeAt(1)) % 10)}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Density scale indicators */}
            <div className="flex gap-4 justify-end mt-4 text-[10px] font-semibold text-slate-400 select-none">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-slate-100 dark:bg-slate-800 border" /> Empty
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-indigo-500/20" /> Low
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-indigo-500/50" /> Mid
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded bg-indigo-600" /> Peak
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Department Summaries & Service Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dept allocations table summary */}
        <Card className="flex flex-col gap-4">
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
            Department-wise Allocation Summary
          </h4>
          <Table
            loading={loading}
            columns={[
              { key: 'name', header: 'Department' },
              { key: 'activeAlloc', header: 'Active Checked-out Assets' },
              { key: 'totalAllocs', header: 'Lifetime Historical Allocations' }
            ]}
            data={getDeptSummary()}
          />
        </Card>

        {/* Nearing Service / Damaged assets alerts */}
        <Card className="flex flex-col gap-4">
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
            Assets Nearing Service / Repair alerts
          </h4>
          <Table
            loading={loading}
            columns={[
              { key: 'assetTag', header: 'Asset Tag' },
              { key: 'name', header: 'Asset Name' },
              { key: 'condition', header: 'Condition' },
              {
                key: 'status',
                header: 'Lifecycle Status',
                render: (row) => <Badge status={row.status} />
              }
            ]}
            data={getAssetsNearingService()}
            emptyMessage="All company assets are in excellent/good condition"
          />
        </Card>
      </div>
    </div>
  );
};

export default Reports;
export { Reports };
