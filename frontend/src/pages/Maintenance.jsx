import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/modal/Modal';
import FileUpload from '../components/forms/FileUpload';
import Textarea from '../components/forms/Textarea';
import api from '../services/api';

const Maintenance = () => {
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotifications();

  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [raiseModalOpen, setRaiseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Forms
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Raise ticket form
  const [raiseAssetId, setRaiseAssetId] = useState('');
  const [raiseDesc, setRaiseDesc] = useState('');
  const [raisePriority, setRaisePriority] = useState('Medium');
  const [raisePhoto, setRaisePhoto] = useState('');

  // Manage ticket form
  const [manageStatus, setManageStatus] = useState('Pending');
  const [manageTech, setManageTech] = useState('');
  const [manageNotes, setManageNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, assetsRes, empsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets'),
        api.get('/employees')
      ]);
      setTickets(ticketsRes.data.data || []);
      setAssets(assetsRes.data.data || []);
      setEmployees(empsRes.data.data || []);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        assetId: raiseAssetId,
        issueDescription: raiseDesc,
        priority: raisePriority,
        photo: raisePhoto
      });

      showNotification('Maintenance request raised successfully', 'success');
      setRaiseModalOpen(false);
      
      // Clear forms
      setRaiseAssetId('');
      setRaiseDesc('');
      setRaisePriority('Medium');
      setRaisePhoto('');

      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleManageSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${selectedTicket._id}/status`, {
        status: manageStatus,
        technician: manageTech,
        notes: manageNotes
      });

      showNotification(`Ticket updated to: ${manageStatus}`, 'success');
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const openManage = (ticket) => {
    setSelectedTicket(ticket);
    setManageStatus(ticket.status);
    setManageTech(ticket.technician || '');
    setManageNotes(ticket.notes || '');
    setEditModalOpen(true);
  };

  const getAssetTag = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? asset.assetTag : 'AF-XXXX';
  };

  const getAssetName = (id) => {
    const asset = assets.find(a => a._id === id);
    return asset ? asset.name : 'Unknown Asset';
  };

  const isManager = hasRole(['Admin', 'Asset Manager']);

  // Kanban Stage Column Definitions
  const columns = [
    {
      title: 'Pending',
      filter: (t) => t.status === 'Pending',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'Approved',
      filter: (t) => t.status === 'Approved' && !t.technician,
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Technician assigned',
      filter: (t) => (t.status === 'Approved' || t.status === 'In Progress') && t.technician,
      borderColor: 'border-sky-500/20'
    },
    {
      title: 'in progress',
      filter: (t) => t.status === 'In Progress' && !t.technician,
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Resolved',
      filter: (t) => t.status === 'Resolved',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Maintenance requests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage repair workflows and tracking diagnostics stages in kanban pipelines.
          </p>
        </div>
        <Button size="sm" onClick={() => setRaiseModalOpen(true)}>
          🔧 Raise Repair Ticket
        </Button>
      </div>

      {/* KANBAN BOARD CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start select-none">
        {columns.map((col, idx) => {
          const colTickets = tickets.filter(col.filter);
          return (
            <div
              key={idx}
              className={`flex flex-col gap-3 p-3 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/40 min-h-[450px] ${col.borderColor}`}
            >
              {/* Header column title */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                  {col.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets cards list */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
                {colTickets.map((t) => {
                  const isResolved = t.status === 'Resolved';
                  return (
                    <div
                      key={t._id}
                      onClick={() => isManager && openManage(t)}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                        isResolved
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                          {getAssetTag(t.asset)}
                        </span>
                        <Badge status={t.priority} />
                      </div>
                      
                      <h6 className="font-extrabold text-xs tracking-tight line-clamp-1">
                        {getAssetName(t.asset)}
                      </h6>
                      
                      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                        {t.issueDescription}
                      </p>

                      {t.technician && (
                        <div className="border-t border-dashed border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[9px] font-bold text-indigo-500">
                          <span>👤 tech: {t.technician}</span>
                        </div>
                      )}

                      {isResolved && t.updatedAt && (
                        <div className="text-[9px] font-bold text-emerald-600 border-t border-dashed border-emerald-500/10 pt-2">
                          ✓ resolved {new Date(t.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* RAISE REPAIR MODAL */}
      <Modal isOpen={raiseModalOpen} onClose={() => setRaiseModalOpen(false)} title="Raise Repair Ticket" size="lg">
        <form onSubmit={handleRaiseSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <Select
              label="Select Damaged Asset"
              value={raiseAssetId}
              onChange={e => setRaiseAssetId(e.target.value)}
              options={assets.map(a => ({ value: a._id, label: `${a.name} (${a.assetTag})` }))}
              placeholder="Select asset..."
              required
            />

            <Select
              label="Issue Severity / Priority"
              value={raisePriority}
              onChange={e => setRaisePriority(e.target.value)}
              options={['Low', 'Medium', 'High', 'Critical']}
              placeholder={null}
              required
            />

            <Textarea
              label="Issue Description / Symptoms"
              placeholder="e.g. Laptop charger heating up or battery swelling..."
              value={raiseDesc}
              onChange={e => setRaiseDesc(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-4">
            <FileUpload label="Attach Photo (Receipt/Damage)" value={raisePhoto} onChange={setRaisePhoto} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" onClick={() => setRaiseModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE TICKET WORKFLOW MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Manage Ticket: ${selectedTicket ? selectedTicket._id : ''}`} size="md">
        {selectedTicket && (
          <form onSubmit={handleManageSubmit} className="flex flex-col gap-4">
            <div className="border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/10">
              <span className="text-xs font-bold text-slate-400">TICKET DETAILED SPEC:</span>
              <h5 className="font-bold text-sm">{getAssetName(selectedTicket.asset)} ({getAssetTag(selectedTicket.asset)})</h5>
              <p className="text-xs text-slate-500 mt-1 italic">"{selectedTicket.issueDescription}"</p>
              
              {selectedTicket.photo && (
                <img src={selectedTicket.photo} alt="Issue" className="mt-3 max-h-32 object-contain rounded-lg border border-slate-200 dark:border-slate-800" />
              )}
            </div>

            <Select
              label="Update Workflow Status"
              value={manageStatus}
              onChange={e => setManageStatus(e.target.value)}
              options={['Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved']}
              placeholder={null}
              required
            />

            <Input
              label="Assigned Technician Name"
              placeholder="e.g. Steve Jobs (Technician)"
              value={manageTech}
              onChange={e => setManageTech(e.target.value)}
            />

            <Textarea
              label="Diagnostic / Resolution Notes"
              placeholder="Describe repairs conducted or reason for rejection..."
              value={manageNotes}
              onChange={e => setManageNotes(e.target.value)}
            />

            <Button type="submit" className="mt-2">Update Ticket Stage</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Maintenance;
export { Maintenance };
