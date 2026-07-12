import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Table from '../components/tables/Table';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const ActivityLogs = () => {
  const { showNotification } = useNotifications();
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, empsRes] = await Promise.all([
        api.get('/activity-logs'),
        api.get('/users')
      ]);
      setLogs(logsRes.data.data || []);
      setEmployees(empsRes.data.data || []);
    } catch (err) {
      showNotification('Unable to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEmployeeName = (row) => {
    const user = row?.User || null;
    if (user) {
      return `${user.name} (${user.role})`;
    }
    const emp = employees.find((e) => e.id === row?.userId || e.id === row?.performedBy);
    return emp ? `${emp.name} (${emp.role})` : <span className="opacity-40">System Trigger</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Activity Logs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Comprehensive, read-only audit trails tracking user actions, asset transfers, allocations, and repairs.
        </p>
      </div>

      <Card>
        <Table
          loading={loading}
          columns={[
            {
              key: 'timestamp',
              header: 'Timestamp',
              render: (row) => new Date(row.timestamp || row.createdAt).toLocaleString()
            },
            {
              key: 'action',
              header: 'Action Performed',
              render: (row) => <Badge status={row.action} />
            },
            {
              key: 'details',
              header: 'Log Message / Event Details',
              render: (row) => <span className="font-semibold text-xs text-slate-600 dark:text-slate-400 leading-normal">{row.details}</span>
            },
            {
              key: 'performedBy',
              header: 'Performed By',
              render: (row) => getEmployeeName(row)
            }
          ]}
          data={logs}
        />
      </Card>
    </div>
  );
};

export default ActivityLogs;
