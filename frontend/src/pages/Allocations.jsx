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
import Textarea from '../components/forms/Textarea';
import api from '../services/api';

const Allocations = () => {
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotifications();

  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Allocation Form
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assignedType, setAssignedType] = useState('user'); // user, department
  const [assigneeId, setAssigneeId] = useState('');
  const [expReturnDate, setExpReturnDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Return Form
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinCondition, setCheckinCondition] = useState('Good');

  // Conflict Details
  const [conflictDetails, setConflictDetails] = useState({
    message: '',
    holderName: '',
    holderUserId: '',
    allocationId: '',
    targetUserId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, assetsRes, empsRes, deptsRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/assets'),
        api.get('/employees'),
        api.get('/departments')
      ]);
      setAllocations(allocRes.data.data);
      setAssets(assetsRes.data.data);
      setEmployees(empsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Allocation Submit
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        assetId: selectedAssetId,
        assignedTo: assignedType === 'user' ? assigneeId : null,
        assignedDepartment: assignedType === 'department' ? assigneeId : null,
        expectedReturnDate: expReturnDate || null,
        checkOutNotes: checkoutNotes
      };

      await api.post('/allocations', body);
      showNotification('Asset allocated successfully', 'success');
      setAllocateModalOpen(false);
      clearForms();
      fetchData();
    } catch (err) {
      // Catch Conflict Rule: check if error response code is 409
      if (err.response && err.response.status === 409) {
        const conflict = err.response.data.currentlyHeldBy;
        setConflictDetails({
          message: err.message,
          holderName: conflict ? conflict.name : 'Another user',
          holderUserId: conflict ? conflict.userId : '',
          allocationId: conflict ? conflict.allocationId : '',
          targetUserId: assignedType === 'user' ? assigneeId : ''
        });
        setAllocateModalOpen(false);
        setConflictModalOpen(true);
      } else {
        showNotification(err.message, 'error');
      }
    }
  };

  // Submit Transfer Request
  const handleTransferRequest = async () => {
    try {
      await api.post('/allocations/transfer-request', {
        assetId: selectedAssetId,
        targetUserId: conflictDetails.targetUserId,
        notes: `Requested direct transfer from ${conflictDetails.holderName}`
      });
      showNotification('Transfer request submitted successfully. Awaiting Manager approval.', 'success');
      setConflictModalOpen(false);
      clearForms();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Approve direct transfer
  const handleApproveTransfer = async (allocId, targetUserId) => {
    try {
      await api.post(`/allocations/${allocId}/approve-transfer`, { targetUserId });
      showNotification('Asset transfer completed successfully', 'success');
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Handle Return Submit
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/allocations/${selectedAllocId}/return`, {
        checkInNotes: checkinNotes,
        condition: checkinCondition
      });
      showNotification('Asset return confirmed', 'success');
      setReturnModalOpen(false);
      clearForms();
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const openReturn = (alloc) => {
    setSelectedAllocId(alloc._id);
    setCheckinNotes('');
    setCheckinCondition('Good');
    setReturnModalOpen(true);
  };

  const clearForms = () => {
    setSelectedAssetId('');
    setAssigneeId('');
    setExpReturnDate('');
    setCheckoutNotes('');
    setCheckinNotes('');
  };

  const isManager = hasRole(['Admin', 'Asset Manager']);

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Allocations & Transfers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage who holds what assets. Allocate, direct-transfer, and confirm returns.
          </p>
        </div>
        {isManager && (
          <Button size="sm" onClick={() => setAllocateModalOpen(true)}>
            + New Allocation
          </Button>
        )}
      </div>

      {/* Main List */}
      <Card>
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-base">Active & Historical Allocations</h3>

          <Table
            loading={loading}
            columns={[
              {
                key: 'asset',
                header: 'Asset Name/Tag',
                render: (row) => {
                  const asset = assets.find(a => a._id === row.asset);
                  return asset ? `${asset.name} (${asset.assetTag})` : 'Unknown';
                }
              },
              {
                key: 'assignedTo',
                header: 'Assigned Recipient',
                render: (row) => {
                  if (row.assignedTo) {
                    const emp = employees.find(e => e._id === row.assignedTo);
                    return emp ? `👤 ${emp.name}` : 'Unknown';
                  } else if (row.assignedDepartment) {
                    const dept = departments.find(d => d._id === row.assignedDepartment);
                    return dept ? `🏢 ${dept.name} Dept` : 'Unknown';
                  }
                  return 'Unassigned';
                }
              },
              {
                key: 'expectedReturnDate',
                header: 'Expected Return',
                render: (row) => {
                  if (!row.expectedReturnDate) return 'N/A';
                  const date = new Date(row.expectedReturnDate);
                  const isOverdue = row.status === 'Active' && date < new Date();
                  return (
                    <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>
                      {date.toLocaleDateString()} {isOverdue ? '(OVERDUE)' : ''}
                    </span>
                  );
                }
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge status={row.status} />
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => {
                  if (row.status !== 'Active') return <span className="opacity-40 text-xs">Closed</span>;
                  return (
                    <div className="flex gap-2">
                      {isManager && (
                        <Button variant="outline" size="sm" onClick={() => openReturn(row)}>
                          Confirm Return
                        </Button>
                      )}
                      {/* If employee wants to request a transfer or if manager approves a direct transfer */}
                      {isManager && row.assignedTo && (
                        <Dropdown
                          trigger={<Button variant="secondary" size="sm">Options ▾</Button>}
                          items={employees
                            .filter(emp => emp._id !== row.assignedTo && emp.status === 'Active')
                            .map(emp => ({
                              label: `Transfer directly to ${emp.name}`,
                              onClick: () => handleApproveTransfer(row._id, emp._id)
                            }))}
                        />
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={allocations}
          />
        </div>
      </Card>

      {/* ========================================== */}
      {/* ALLOCATE ASSET MODAL */}
      {/* ========================================== */}
      <Modal isOpen={allocateModalOpen} onClose={() => setAllocateModalOpen(false)} title="Allocate Asset">
        <form onSubmit={handleAllocateSubmit} className="flex flex-col gap-4">
          <Select
            label="Asset to Allocate"
            value={selectedAssetId}
            onChange={e => setSelectedAssetId(e.target.value)}
            options={assets.map(a => ({
              value: a._id,
              label: `${a.name} (${a.assetTag}) - Status: ${a.status}`
            }))}
            placeholder="Select asset..."
            required
          />

          <div className="grid grid-cols-2 gap-3 border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs select-none">
              <input
                type="radio"
                name="assignType"
                checked={assignedType === 'user'}
                onChange={() => {
                  setAssignedType('user');
                  setAssigneeId('');
                }}
              />
              Assign to Employee
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs select-none">
              <input
                type="radio"
                name="assignType"
                checked={assignedType === 'department'}
                onChange={() => {
                  setAssignedType('department');
                  setAssigneeId('');
                }}
              />
              Assign to Department
            </label>
          </div>

          {assignedType === 'user' ? (
            <Select
              label="Select Employee"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              options={employees.map(e => ({ value: e._id, label: e.name }))}
              placeholder="Select employee..."
              required
            />
          ) : (
            <Select
              label="Select Department"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              options={departments.map(d => ({ value: d._id, label: d.name }))}
              placeholder="Select department..."
              required
            />
          )}

          <DatePicker
            label="Expected Return Date (Optional)"
            value={expReturnDate}
            onChange={e => setExpReturnDate(e.target.value)}
          />

          <Textarea
            label="Check-out Notes / Condition comments"
            value={checkoutNotes}
            onChange={e => setCheckoutNotes(e.target.value)}
          />

          <Button type="submit" className="mt-2">Confirm Allocation</Button>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* CONFLICT / TRANSFER BLOCKER DIALOG */}
      {/* ========================================== */}
      <Modal isOpen={conflictModalOpen} onClose={() => setConflictModalOpen(false)} title="Conflict: Asset Unavailable" size="sm">
        <div className="flex flex-col gap-4 text-sm leading-normal">
          <div className="text-center text-4xl py-2">⚠️</div>
          <p>
            The selected asset is already checked out!
          </p>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl font-medium">
            Currently held by: <b className="text-indigo-600 dark:text-indigo-400">{conflictDetails.holderName}</b>
          </div>
          <p className="text-xs text-slate-500">
            You cannot allocate an asset that is currently taken. Would you like to submit a formal <b>Transfer Request</b> to take over this asset?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setConflictModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleTransferRequest}>Request Transfer</Button>
          </div>
        </div>
      </Modal>

      {/* ========================================== */}
      {/* RETURN CONFIRMATION MODAL */}
      {/* ========================================== */}
      <Modal isOpen={returnModalOpen} onClose={() => setReturnModalOpen(false)} title="Confirm Asset Return">
        <form onSubmit={handleReturnSubmit} className="flex flex-col gap-4">
          <Select
            label="Verified Asset Condition"
            value={checkinCondition}
            onChange={e => setCheckinCondition(e.target.value)}
            options={['New', 'Good', 'Fair', 'Poor', 'Damaged']}
            placeholder={null}
            required
          />

          <Textarea
            label="Return Check-in Notes / Condition remarks"
            value={checkinNotes}
            onChange={e => setCheckinNotes(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" className="mt-2">Confirm Return & Check-in</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Allocations;
