import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Badge from '../components/ui/Badge';
import Table from '../components/tables/Table';
import Modal from '../components/modal/Modal';
import DatePicker from '../components/forms/DatePicker';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';

const Audits = () => {
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotifications();

  const [audits, setAudits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  // Active States
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Create Form
  const [title, setTitle] = useState('');
  const [scopeDept, setScopeDept] = useState('');
  const [scopeLoc, setScopeLoc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorId, setAuditorId] = useState('');

  // Verify Form
  const [vStatus, setVStatus] = useState('Verified');
  const [vNotes, setVNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [auditsRes, empsRes, deptsRes, assetsRes] = await Promise.all([
        api.get('/audits'),
        api.get('/employees'),
        api.get('/departments'),
        api.get('/assets')
      ]);
      setAudits(auditsRes.data.data);
      setEmployees(empsRes.data.data);
      setDepartments(deptsRes.data.data);
      setAssets(assetsRes.data.data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/audits', {
        title,
        scopeDepartment: scopeDept || null,
        scopeLocation: scopeLoc || '',
        startDate,
        endDate,
        auditors: auditorId ? [auditorId] : []
      });

      showNotification('Audit cycle initialized successfully', 'success');
      setCreateModalOpen(false);
      
      // Clear
      setTitle('');
      setScopeDept('');
      setScopeLoc('');
      setStartDate('');
      setEndDate('');
      setAuditorId('');

      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/audits/${selectedAudit._id}/verify/${selectedItem.asset}`, {
        verificationStatus: vStatus,
        notes: vNotes
      });

      showNotification('Asset checked-off successfully', 'success');
      setVerifyModalOpen(false);
      
      // Refresh active detail view modal data
      const refreshRes = await api.get(`/audits/${selectedAudit._id}`);
      setSelectedAudit(refreshRes.data.data);
      
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCloseAudit = async (auditId) => {
    try {
      const res = await api.put(`/audits/${auditId}/close`);
      const report = res.data.discrepancyReport;
      showNotification(
        `Audit cycle locked! Discrepancy report - Missing: ${report.missing}, Damaged: ${report.damaged}. Missing items flagged as LOST.`,
        'success'
      );
      setDetailModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const openVerify = (item) => {
    setSelectedItem(item);
    setVStatus(item.verificationStatus === 'Pending' ? 'Verified' : item.verificationStatus);
    setVNotes(item.notes || '');
    setVerifyModalOpen(true);
  };

  const openDetail = (audit) => {
    setSelectedAudit(audit);
    setDetailModalOpen(true);
  };

  const getAssetName = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? `${asset.name} (${asset.assetTag})` : 'Unknown Asset';
  };

  const getAssetLocation = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? asset.location : 'N/A';
  };

  // Helper stats
  const getAuditProgress = (audit) => {
    if (!audit || !audit.items || audit.items.length === 0) return 0;
    const completed = audit.items.filter(i => i.verificationStatus !== 'Pending').length;
    return Math.round((completed / audit.items.length) * 100);
  };

  const getDiscrepancyCounts = (audit) => {
    if (!audit || !audit.items) return { missing: 0, damaged: 0 };
    const missing = audit.items.filter(i => i.verificationStatus === 'Missing').length;
    const damaged = audit.items.filter(i => i.verificationStatus === 'Damaged').length;
    return { missing, damaged };
  };

  const isAdmin = hasRole(['Admin']);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Physical Asset Audits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Run periodic verification cycles to confirm physical inventory condition and flag discrepancies.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            + Initialize Audit Cycle
          </Button>
        )}
      </div>

      {/* Grid of Audit Cycles */}
      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-base">Verification Cycles Directory</h3>

          <Table
            loading={loading}
            columns={[
              { key: 'title', header: 'Cycle Title' },
              {
                key: 'scope',
                header: 'Audit Scope',
                render: (row) => row.scopeLocation || 'All Locations'
              },
              {
                key: 'progress',
                header: 'Verification Progress',
                render: (row) => (
                  <div className="w-36 flex flex-col gap-1">
                    <ProgressBar value={getAuditProgress(row)} showPercent={true} />
                  </div>
                )
              },
              {
                key: 'status',
                header: 'Cycle Status',
                render: (row) => <Badge status={row.status} />
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Button variant="outline" size="sm" onClick={() => openDetail(row)}>
                    Open Cycle Audit
                  </Button>
                )
              }
            ]}
            data={audits}
          />
        </div>
      </Card>

      {/* ========================================== */}
      {/* INITIALIZE AUDIT CYCLE MODAL */}
      {/* ========================================== */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Initialize Audit Cycle" size="md">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input label="Cycle Title / Identifier" placeholder="e.g. Q3 Office Inventory Audit" value={title} onChange={e => setTitle(e.target.value)} required />
          
          <Select
            label="Filter Scope: Department"
            value={scopeDept}
            onChange={e => setScopeDept(e.target.value)}
            options={departments.map(d => ({ value: d._id, label: d.name }))}
            placeholder="All Departments"
          />

          <Select
            label="Filter Scope: Location / Building"
            value={scopeLoc}
            onChange={e => setScopeLoc(e.target.value)}
            options={Array.from(new Set(assets.map(a => a.location).filter(l => l)))}
            placeholder="All Locations"
          />

          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Audit Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            <DatePicker label="Audit End Date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
          </div>

          <Select
            label="Assigned Auditor"
            value={auditorId}
            onChange={e => setAuditorId(e.target.value)}
            options={employees.map(e => ({ value: e._id, label: e.name }))}
            placeholder="Choose auditor..."
            required
          />

          <Button type="submit" className="mt-2">Initialize Scope Checklists</Button>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* AUDIT CHECKLIST DETAIL MODAL */}
      {/* ========================================== */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedAudit ? `Audit Cycle: ${selectedAudit.title}` : ''} size="xl">
        {selectedAudit && (
          <div className="flex flex-col gap-6">
            {/* KPI Discrepancy details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Progress</span>
                <h4 className="text-xl font-extrabold text-indigo-600 mt-1">{getAuditProgress(selectedAudit)}%</h4>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Missing Assets Flagged</span>
                <h4 className="text-xl font-extrabold text-rose-500 mt-1">{getDiscrepancyCounts(selectedAudit).missing}</h4>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Damaged Assets Flagged</span>
                <h4 className="text-xl font-extrabold text-amber-500 mt-1">{getDiscrepancyCounts(selectedAudit).damaged}</h4>
              </div>
            </div>

            {/* Asset checklist list table */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Asset Verification Checklists</h5>
                {selectedAudit.status === 'Active' && isAdmin && (
                  <Button variant="danger" size="sm" onClick={() => handleCloseAudit(selectedAudit._id)}>
                    Lock & Close Cycle
                  </Button>
                )}
              </div>

              <Table
                columns={[
                  {
                    key: 'asset',
                    header: 'Asset Name/Tag',
                    render: (row) => getAssetName(row.asset)
                  },
                  {
                    key: 'location',
                    header: 'Location / Room',
                    render: (row) => getAssetLocation(row.asset)
                  },
                  {
                    key: 'verificationStatus',
                    header: 'Audit State',
                    render: (row) => <Badge status={row.verificationStatus} />
                  },
                  {
                    key: 'notes',
                    header: 'Auditor Notes',
                    render: (row) => row.notes || <span className="opacity-40 text-xs">-</span>
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => {
                      if (selectedAudit.status !== 'Active') return <span className="opacity-40 text-xs">Closed</span>;
                      
                      // Check if user is the assigned auditor or an admin
                      const isAuditor = selectedAudit.auditors.includes(user?._id) || isAdmin;
                      if (isAuditor) {
                        return (
                          <Button variant="outline" size="sm" onClick={() => openVerify(row)}>
                            Verify Condition
                          </Button>
                        );
                      }
                      return <span className="opacity-40 text-xs">Auditors Only</span>;
                    }
                  }
                ]}
                data={selectedAudit.items || []}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* PHYSICAL VERIFICATION MODAL */}
      {/* ========================================== */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title="Verify Asset Condition" size="sm">
        {selectedItem && (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
            <h6 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              Verify: {getAssetName(selectedItem.asset)}
            </h6>

            <Select
              label="Physical Condition Status"
              value={vStatus}
              onChange={e => setVStatus(e.target.value)}
              options={['Verified', 'Missing', 'Damaged']}
              placeholder={null}
              required
            />

            <Textarea
              label="Verification Notes"
              placeholder="e.g. Checked item. Found damaged keyboard..."
              value={vNotes}
              onChange={e => setVNotes(e.target.value)}
            />

            <Button type="submit" className="mt-2">Log Verification</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Audits;
