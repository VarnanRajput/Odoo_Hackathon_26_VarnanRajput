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

  // View control: Directory list vs Active checklist (Screen 8)
  const [activeAuditId, setActiveAuditId] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  // Active item for verification
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
      setAudits(auditsRes.data.data || []);
      setEmployees(empsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
      setAssets(assetsRes.data.data || []);
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
      await api.put(`/audits/${activeAuditId}/verify/${selectedItem.asset}`, {
        verificationStatus: vStatus,
        notes: vNotes
      });

      showNotification('Asset verified successfully', 'success');
      setVerifyModalOpen(false);
      
      // Refresh
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleCloseAudit = async (auditId) => {
    try {
      const res = await api.put(`/audits/${auditId}/close`);
      const report = res.data.discrepancyReport || { missing: 0, damaged: 0 };
      showNotification(
        `Audit Locked! Missing: ${report.missing}, Damaged: ${report.damaged}. Missing items marked LOST.`,
        'success'
      );
      setActiveAuditId(null);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const getAssetName = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? `${asset.assetTag} ${asset.name}` : 'Unknown Asset';
  };

  const getAssetLocation = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? asset.location : 'Desk E12';
  };

  const getAuditProgress = (audit) => {
    if (!audit || !audit.items || audit.items.length === 0) return 0;
    const completed = audit.items.filter(i => i.verificationStatus !== 'Pending').length;
    return Math.round((completed / audit.items.length) * 100);
  };

  const getFlaggedCount = (audit) => {
    if (!audit || !audit.items) return 0;
    return audit.items.filter(i => ['Missing', 'Damaged'].includes(i.verificationStatus)).length;
  };

  const getAuditorNames = (audit) => {
    if (!audit || !audit.auditors) return 'Unassigned';
    return audit.auditors.map(audId => {
      const emp = employees.find(e => e._id === audId);
      return emp ? emp.name : 'Auditor';
    }).join(', ');
  };

  const getDeptName = (id) => {
    const dept = departments.find(d => d._id === id);
    return dept ? dept.name : 'Engineering dept';
  };

  const isAdmin = hasRole(['Admin']);
  const activeAudit = audits.find(a => a._id === activeAuditId);

  // Return to Directory View
  if (!activeAuditId || !activeAudit) {
    return (
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Physical Asset Audits</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Run periodic verification cycles to confirm physical inventory condition and location.
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              + Initialize Audit Cycle
            </Button>
          )}
        </div>

        {/* Directory Grid */}
        <Card className="flex flex-col gap-4">
          <h3 className="font-bold text-base">Verification Cycles Directory</h3>
          <Table
            loading={loading}
            columns={[
              { key: 'title', header: 'Cycle Title' },
              {
                key: 'scope',
                header: 'Department / Scope',
                render: (row) => row.scopeDepartment ? getDeptName(row.scopeDepartment) : 'All Departments'
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
                  <Button variant="outline" size="sm" onClick={() => setActiveAuditId(row._id)}>
                    Open Cycle Audit
                  </Button>
                )
              }
            ]}
            data={audits}
          />
        </Card>

        {/* INITIALIZE AUDIT CYCLE MODAL */}
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
      </div>
    );
  }

  // ACTIVE AUDIT CHECKLIST VIEW (Screen 8 Mockup Layout)
  const flaggedCount = getFlaggedCount(activeAudit);
  const auditStartFormatted = new Date(activeAudit.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const auditEndFormatted = new Date(activeAudit.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col gap-6">
      {/* Title with Back Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Active Audit Checklist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Verify expected locations of physical assets inside the active audit cycle.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setActiveAuditId(null)}>
          &larr; Back to Directory
        </Button>
      </div>

      {/* 1. GREY SCOPE HEADER (Screen 8 Mockup) */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-slate-700 dark:text-slate-300">
        <div>
          <h4 className="font-extrabold text-sm uppercase tracking-tight text-slate-800 dark:text-slate-200">
            {activeAudit.title}: {getDeptName(activeAudit.scopeDepartment)} - {auditStartFormatted} to {auditEndFormatted}
          </h4>
          <span className="text-xs font-semibold text-slate-500 block mt-1">
            Auditors: <b>{getAuditorNames(activeAudit)}</b>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold uppercase text-slate-400">Progress:</span>
          <div className="w-28">
            <ProgressBar value={getAuditProgress(activeAudit)} showPercent={true} />
          </div>
        </div>
      </div>

      {/* 2. AUDIT CHECKLIST TABLE */}
      <Card className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Expected location</th>
                <th className="pb-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {activeAudit.items.map((item, idx) => {
                const status = item.verificationStatus;
                const isAuditor = activeAudit.auditors.includes(user?._id) || isAdmin;

                return (
                  <tr key={idx} className="text-sm font-semibold">
                    <td className="py-4 text-slate-800 dark:text-slate-100">{getAssetName(item.asset)}</td>
                    <td className="py-4 text-slate-500">{getAssetLocation(item.asset)}</td>
                    <td className="py-4 text-right">
                      {activeAudit.status === 'Active' && isAuditor ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => { setSelectedItem(item); setVStatus('Verified'); setVerifyModalOpen(true); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              status === 'Verified'
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:border-emerald-500/40'
                            }`}
                          >
                            Verified
                          </button>
                          <button
                            onClick={() => { setSelectedItem(item); setVStatus('Missing'); setVerifyModalOpen(true); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              status === 'Missing'
                                ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:border-rose-500/40'
                            }`}
                          >
                            Missing
                          </button>
                          <button
                            onClick={() => { setSelectedItem(item); setVStatus('Damaged'); setVerifyModalOpen(true); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              status === 'Damaged'
                                ? 'bg-slate-500/10 border-slate-500 text-slate-600 dark:text-slate-400'
                                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-500/40'
                            }`}
                          >
                            Damaged
                          </button>
                        </div>
                      ) : (
                        <Badge status={status} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3. YELLOW WARNING DISCREPANCY BANNER (Screen 8 Mockup) */}
        {flaggedCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-xs font-bold text-center mt-4">
            ⚠️ {flaggedCount} assets flagged - discrepancy report generated automatically
          </div>
        )}

        {/* 4. CLOSE AUDIT CYCLE BUTTON */}
        {activeAudit.status === 'Active' && isAdmin && (
          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-start">
            <button
              onClick={() => handleCloseAudit(activeAudit._id)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-slate-200 hover:opacity-90 transition-all cursor-pointer"
            >
              Close audit cycle
            </button>
          </div>
        )}
      </Card>

      {/* VERIFY NOTES INPUT MODAL */}
      <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title={`Confirm Audit State: ${selectedItem ? getAssetName(selectedItem.asset) : ''}`} size="sm">
        {selectedItem && (
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              Confirm marking asset condition as: <b className="text-indigo-500">{vStatus}</b>
            </p>
            
            <Textarea
              label="Auditor Diagnostics / Notes"
              placeholder="e.g. Verified physically at Desk E12. Serial number matched."
              value={vNotes}
              onChange={e => setVNotes(e.target.value)}
              required={vStatus !== 'Verified'} // Notes required if missing/damaged
            />

            <Button type="submit" className="mt-2">Save Checkoff</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Audits;
export { Audits };
