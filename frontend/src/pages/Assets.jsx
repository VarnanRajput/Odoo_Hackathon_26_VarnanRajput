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
import FileUpload from '../components/forms/FileUpload';
import SearchBar from '../components/common/SearchBar';
import Timeline from '../components/ui/Timeline';
import ToggleSwitch from '../components/forms/ToggleSwitch';
import DatePicker from '../components/forms/DatePicker';
import api from '../services/api';

const Assets = () => {
  const { user, hasRole } = useAuth();
  const { showNotification } = useNotifications();

  // Directory lists
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Asset detail history states
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetHistory, setAssetHistory] = useState({ allocations: [], maintenance: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [assetName, setAssetName] = useState('');
  const [assetCat, setAssetCat] = useState('');
  const [serialNum, setSerialNum] = useState('');
  const [acqDate, setAcqDate] = useState('');
  const [acqCost, setAcqCost] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState('');
  const [shared, setShared] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const q = [];
      if (search) q.push(`search=${encodeURIComponent(search)}`);
      if (selectedCategory) q.push(`category=${selectedCategory}`);
      if (selectedStatus) q.push(`status=${selectedStatus}`);
      if (selectedLocation) q.push(`location=${selectedLocation}`);
      
      const queryString = q.length > 0 ? `?${q.join('&')}` : '';
      const res = await api.get(`/assets${queryString}`);
      setAssets(res.data.data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseData = async () => {
    try {
      const [catsRes, deptsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments')
      ]);
      setCategories(catsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [search, selectedCategory, selectedStatus, selectedLocation]);

  // Handle register asset submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: assetName,
        category: assetCat,
        serialNumber: serialNum,
        acquisitionDate: acqDate || new Date().toISOString(),
        acquisitionCost: Number(acqCost) || 0,
        condition,
        location,
        photo,
        shared
      };

      await api.post('/assets', body);
      showNotification('Asset registered successfully', 'success');
      setRegisterModalOpen(false);
      
      // Clear forms
      setAssetName('');
      setAssetCat('');
      setSerialNum('');
      setAcqDate('');
      setAcqCost('');
      setCondition('Good');
      setLocation('');
      setPhoto('');
      setShared(false);

      fetchAssets();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Open asset detail modal and load history logs
  const handleRowClick = async (asset) => {
    setSelectedAsset(asset);
    setDetailsModalOpen(true);
    setHistoryLoading(true);

    try {
      const res = await api.get(`/assets/${asset._id}`);
      setAssetHistory(res.data.history || { allocations: [], maintenance: [] });
    } catch (err) {
      showNotification('Failed to fetch asset history logs', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Map timelines
  const getTimelineItems = () => {
    const items = [];
    
    // Process allocations
    assetHistory.allocations.forEach(alloc => {
      items.push({
        date: alloc.createdAt,
        title: `Asset Allocated`,
        description: `Allocated to ${alloc.assignedTo ? 'Employee' : 'Department'}. Return expected: ${alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'N/A'}. Notes: ${alloc.checkOutNotes || 'None'}`,
        badge: alloc.status
      });

      if (alloc.actualReturnDate) {
        items.push({
          date: alloc.actualReturnDate,
          title: `Asset Returned`,
          description: `Asset checked-in by manager. Check-in Notes: ${alloc.checkInNotes || 'None'}`,
          badge: 'Returned'
        });
      }
    });

    // Process maintenance
    assetHistory.maintenance.forEach(maint => {
      items.push({
        date: maint.createdAt,
        title: `Repair Request raised`,
        description: `Issue: "${maint.issueDescription}". Priority: ${maint.priority}`,
        badge: maint.status
      });
      
      if (maint.status === 'Resolved') {
        items.push({
          date: maint.updatedAt,
          title: `Repair Resolved`,
          description: `Technician: ${maint.technician || 'N/A'}. Resolution Notes: ${maint.notes || 'None'}`,
          badge: 'Resolved'
        });
      }
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const isManager = hasRole(['Admin', 'Asset Manager']);

  return (
    <div className="flex flex-col gap-6">
      {/* Title section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Assets Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Search, filter, and track physical assets and shared bookable resources.
          </p>
        </div>
        {isManager && (
          <Button size="sm" onClick={() => setRegisterModalOpen(true)}>
            + Register Asset
          </Button>
        )}
      </div>

      {/* Advanced Search & Filtering panel */}
      <Card className="flex flex-col gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by tag, serial number, location..."
          filterComponent={
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
              <Select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                options={categories.map(c => ({ value: c._id, label: c.name }))}
                placeholder="Category: All"
                className="w-full sm:w-44 text-xs font-semibold py-1.5"
              />
              <Select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                options={['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed']}
                placeholder="Status: All"
                className="w-full sm:w-44 text-xs font-semibold py-1.5"
              />
              <Select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                options={Array.from(new Set(assets.map(a => a.location).filter(l => l)))}
                placeholder="Location: All"
                className="w-full sm:w-44 text-xs font-semibold py-1.5"
              />
            </div>
          }
        />
      </Card>

      {/* Table view */}
      <Card>
        <Table
          loading={loading}
          onRowClick={handleRowClick}
          columns={[
            { key: 'assetTag', header: 'Asset Tag' },
            { key: 'name', header: 'Asset Name' },
            {
              key: 'category',
              header: 'Category',
              render: (row) => {
                const cat = categories.find(c => c._id === row.category);
                return cat ? cat.name : 'Unknown';
              }
            },
            { key: 'location', header: 'Location' },
            {
              key: 'shared',
              header: 'Type',
              render: (row) => (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {row.shared ? '👥 Shared' : '👤 Assigned'}
                </span>
              )
            },
            {
              key: 'status',
              header: 'Lifecycle Status',
              render: (row) => <Badge status={row.status} />
            }
          ]}
          data={assets}
        />
      </Card>

      {/* ========================================== */}
      {/* REGISTER ASSET MODAL */}
      {/* ========================================== */}
      <Modal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Register New Asset" size="lg">
        <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <Input label="Asset Name" value={assetName} onChange={e => setAssetName(e.target.value)} required />
            
            <Select
              label="Category"
              value={assetCat}
              onChange={e => setAssetCat(e.target.value)}
              options={categories.map(c => ({ value: c._id, label: c.name }))}
              placeholder="Choose category..."
              required
            />

            <Input label="Serial Number / Model ID" value={serialNum} onChange={e => setSerialNum(e.target.value)} />
            
            <div className="grid grid-cols-2 gap-2">
              <DatePicker label="Acquisition Date" value={acqDate} onChange={e => setAcqDate(e.target.value)} />
              <Input label="Acquisition Cost ($)" type="number" value={acqCost} onChange={e => setAcqCost(e.target.value)} />
            </div>
            
            <ToggleSwitch label="Shared / Bookable Slot Resource" checked={shared} onChange={e => setShared(e.target.checked)} />
          </div>

          <div className="flex flex-col gap-4">
            <Select
              label="Initial Physical Condition"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              options={['New', 'Good', 'Fair', 'Poor', 'Damaged']}
              placeholder={null}
            />

            <Input label="Storage Location / Room" value={location} onChange={e => setLocation(e.target.value)} />

            <FileUpload label="Asset Photo Preview" value={photo} onChange={setPhoto} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="outline" onClick={() => setRegisterModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Registration</Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* ASSET DETAIL & TIMELINE HISTORY MODAL */}
      {/* ========================================== */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title={`Asset Details: ${selectedAsset ? selectedAsset.assetTag : ''}`} size="lg">
        {selectedAsset && (
          <div className="flex flex-col gap-6">
            <div className="flex gap-6 flex-col sm:flex-row items-center border-b border-slate-100 dark:border-slate-800 pb-5">
              {selectedAsset.photo ? (
                <img src={selectedAsset.photo} alt={selectedAsset.name} className="h-28 w-28 object-contain rounded-2xl border border-slate-200 dark:border-slate-800" />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-4xl border border-indigo-200/20 font-bold select-none shrink-0">
                  📁
                </div>
              )}
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{selectedAsset.name}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge status={selectedAsset.status} />
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Serial: {selectedAsset.serialNumber || 'N/A'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Loc: {selectedAsset.location || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Acquisition Cost: <b>${selectedAsset.acquisitionCost}</b> | Date: <b>{new Date(selectedAsset.acquisitionDate).toLocaleDateString()}</b>
                </p>
              </div>
            </div>

            {/* Timeline History Section */}
            <div>
              <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-4 tracking-tight flex items-center gap-2">
                ⏳ Asset Operations History Logs
              </h5>
              
              {historyLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto pr-2">
                  <Timeline items={getTimelineItems()} />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Assets;
