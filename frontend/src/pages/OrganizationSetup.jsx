import React, { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Tabs from '../components/ui/Tabs';
import Card from '../components/cards/Card';
import Button from '../components/ui/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Badge from '../components/ui/Badge';
import Table from '../components/tables/Table';
import Modal from '../components/modal/Modal';
import ToggleSwitch from '../components/forms/ToggleSwitch';
import api from '../services/api';

const OrganizationSetup = () => {
  const { showNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);

  // States
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);

  // Edit / Form states
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);

  // Department Form
  const [deptName, setDeptName] = useState('');
  const [deptManager, setDeptManager] = useState('');
  const [deptParent, setDeptParent] = useState('');
  const [deptStatus, setDeptStatus] = useState('Active');

  // Category Form
  const [catName, setCatName] = useState('');
  const [catFields, setCatFields] = useState([]); // Array of { name, label, type }
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Promotion Form
  const [promoteRole, setPromoteRole] = useState('Employee');
  const [promoteDept, setPromoteDept] = useState('');
  const [promoteStatus, setPromoteStatus] = useState('Active');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsRes, catsRes, empsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/categories'),
        api.get('/employees')
      ]);
      setDepartments(deptsRes.data.data);
      setCategories(catsRes.data.data);
      setEmployees(empsRes.data.data);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create or Update Department
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        name: deptName,
        manager: deptManager || null,
        parentDepartment: deptParent || null,
        status: deptStatus
      };

      if (selectedDept) {
        await api.put(`/departments/${selectedDept._id}`, body);
        showNotification('Department updated successfully', 'success');
      } else {
        await api.post('/departments', body);
        showNotification('Department created successfully', 'success');
      }
      setDeptModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Create or Update Category
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { name: catName, fields: catFields };
      if (selectedCat) {
        await api.put(`/categories/${selectedCat._id}`, body);
        showNotification('Category updated successfully', 'success');
      } else {
        await api.post('/categories', body);
        showNotification('Category created successfully', 'success');
      }
      setCatModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Add Category Custom Attribute Attribute Field helper
  const addFieldToCategory = () => {
    if (!newFieldName || !newFieldLabel) {
      showNotification('Field key and label are required', 'warning');
      return;
    }
    setCatFields([...catFields, { name: newFieldName, label: newFieldLabel, type: newFieldType }]);
    setNewFieldName('');
    setNewFieldLabel('');
  };

  const removeFieldFromCategory = (idx) => {
    setCatFields(catFields.filter((_, i) => i !== idx));
  };

  // Promote Employee
  const handlePromotionSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedEmp._id}/promote`, {
        role: promoteRole,
        department: promoteDept || null,
        status: promoteStatus
      });
      showNotification(`${selectedEmp.name} updated successfully`, 'success');
      setPromoteModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Open Modals helper Helpers
  const openNewDept = () => {
    setSelectedDept(null);
    setDeptName('');
    setDeptManager('');
    setDeptParent('');
    setDeptStatus('Active');
    setDeptModalOpen(true);
  };

  const openEditDept = (dept) => {
    setSelectedDept(dept);
    setDeptName(dept.name);
    setDeptManager(dept.manager || '');
    setDeptParent(dept.parentDepartment || '');
    setDeptStatus(dept.status || 'Active');
    setDeptModalOpen(true);
  };

  const openNewCat = () => {
    setSelectedCat(null);
    setCatName('');
    setCatFields([]);
    setCatModalOpen(true);
  };

  const openEditCat = (cat) => {
    setSelectedCat(cat);
    setCatName(cat.name);
    setCatFields(cat.fields || []);
    setCatModalOpen(true);
  };

  const openPromote = (emp) => {
    setSelectedEmp(emp);
    setPromoteRole(emp.role);
    setPromoteDept(emp.department || '');
    setPromoteStatus(emp.status || 'Active');
    setPromoteModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Organization Setup</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Configure departments, asset categories, and manage roles in the employee directory.
        </p>
      </div>

      {/* Tabs list */}
      <Tabs
        tabs={[
          { id: 'departments', label: 'Departments Management', icon: () => <span>🏢</span> },
          { id: 'categories', label: 'Asset Categories', icon: () => <span>🏷️</span> },
          { id: 'employees', label: 'Employee Directory', icon: () => <span>👥</span> }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Main View Area */}
      <Card>
        {activeTab === 'departments' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-base">Registered Departments</h3>
              <Button size="sm" onClick={openNewDept}>+ Create Department</Button>
            </div>

            <Table
              loading={loading}
              columns={[
                { key: 'name', header: 'Department Name' },
                {
                  key: 'manager',
                  header: 'Department Head',
                  render: (row) => {
                    const mgr = employees.find(e => e._id === row.manager);
                    return mgr ? mgr.name : <span className="opacity-40">Unassigned</span>;
                  }
                },
                {
                  key: 'parentDepartment',
                  header: 'Parent Department',
                  render: (row) => {
                    const parent = departments.find(d => d._id === row.parentDepartment);
                    return parent ? parent.name : <span className="opacity-40">None</span>;
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
                  render: (row) => (
                    <Button variant="outline" size="sm" onClick={() => openEditDept(row)}>
                      Edit
                    </Button>
                  )
                }
              ]}
              data={departments}
            />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-bold text-base">Asset Categories</h3>
              <Button size="sm" onClick={openNewCat}>+ Add Category</Button>
            </div>

            <Table
              loading={loading}
              columns={[
                { key: 'name', header: 'Category Name' },
                {
                  key: 'fields',
                  header: 'Custom Fields Schema',
                  render: (row) =>
                    row.fields && row.fields.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {row.fields.map((f, i) => (
                          <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {f.label} ({f.type})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="opacity-40">Standard specs only</span>
                    )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button variant="outline" size="sm" onClick={() => openEditCat(row)}>
                      Edit Schema
                    </Button>
                  )
                }
              ]}
              data={categories}
            />
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-base">Employee Role & Directory Directory</h3>
            
            <Table
              loading={loading}
              columns={[
                { key: 'name', header: 'Employee Name' },
                { key: 'email', header: 'Email Address' },
                {
                  key: 'department',
                  header: 'Department',
                  render: (row) => {
                    const dept = departments.find(d => d._id === row.department);
                    return dept ? dept.name : <span className="opacity-40">None</span>;
                  }
                },
                {
                  key: 'role',
                  header: 'System Role',
                  render: (row) => <Badge status={row.role} />
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => <Badge status={row.status} />
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button variant="outline" size="sm" onClick={() => openPromote(row)}>
                      Promote / Configure
                    </Button>
                  )
                }
              ]}
              data={employees}
            />
          </div>
        )}
      </Card>

      {/* ========================================== */}
      {/* DEPARTMENT MODAL */}
      {/* ========================================== */}
      <Modal isOpen={deptModalOpen} onClose={() => setDeptModalOpen(false)} title={selectedDept ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleDeptSubmit} className="flex flex-col gap-4">
          <Input label="Department Name" value={deptName} onChange={e => setDeptName(e.target.value)} required />
          
          <Select
            label="Department Head"
            value={deptManager}
            onChange={e => setDeptManager(e.target.value)}
            options={employees.map(e => ({ value: e._id, label: e.name }))}
            placeholder="Choose manager..."
          />

          <Select
            label="Parent Department (Optional)"
            value={deptParent}
            onChange={e => setDeptParent(e.target.value)}
            options={departments
              .filter(d => !selectedDept || d._id !== selectedDept._id)
              .map(d => ({ value: d._id, label: d.name }))}
            placeholder="Select parent..."
          />

          <Select
            label="Status"
            value={deptStatus}
            onChange={e => setDeptStatus(e.target.value)}
            options={['Active', 'Inactive']}
            placeholder={null}
          />

          <Button type="submit" className="mt-2">{selectedDept ? 'Save Changes' : 'Create'}</Button>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* CATEGORY MODAL */}
      {/* ========================================== */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={selectedCat ? 'Edit Category specifications' : 'Create Category'}>
        <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
          <Input label="Category Name" value={catName} onChange={e => setCatName(e.target.value)} required />
          
          <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
            <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Custom Fields Specifications</h5>
            
            {/* List custom fields added so far */}
            <div className="flex flex-col gap-2">
              {catFields.length === 0 ? (
                <div className="text-center py-2 text-xs text-slate-400">No custom specifications added</div>
              ) : (
                catFields.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold">{f.label} ({f.type})</span>
                    <button type="button" onClick={() => removeFieldFromCategory(i)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">✕</button>
                  </div>
                ))
              )}
            </div>

            {/* Field Addition Bar */}
            <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <Input label="Attribute Code (e.g. warranty)" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} />
              <Input label="Label (e.g. Warranty Months)" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
              <Select
                label="Type"
                value={newFieldType}
                onChange={e => setNewFieldType(e.target.value)}
                options={['text', 'number', 'date', 'boolean']}
                placeholder={null}
              />
            </div>
            <Button variant="outline" type="button" size="sm" onClick={addFieldToCategory} className="self-end mt-1">
              + Add Attribute Field
            </Button>
          </div>

          <Button type="submit" className="mt-2">{selectedCat ? 'Save Specs' : 'Create'}</Button>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* EMPLOYEE PROMOTION CONFIGURATION MODAL */}
      {/* ========================================== */}
      <Modal isOpen={promoteModalOpen} onClose={() => setPromoteModalOpen(false)} title={`Configure Employee: ${selectedEmp ? selectedEmp.name : ''}`}>
        <form onSubmit={handlePromotionSubmit} className="flex flex-col gap-4">
          <Select
            label="System Role"
            value={promoteRole}
            onChange={e => setPromoteRole(e.target.value)}
            options={['Employee', 'Department Head', 'Asset Manager', 'Admin']}
            placeholder={null}
          />

          <Select
            label="Assigned Department"
            value={promoteDept}
            onChange={e => setPromoteDept(e.target.value)}
            options={departments.map(d => ({ value: d._id, label: d.name }))}
            placeholder="Select department..."
          />

          <Select
            label="Status"
            value={promoteStatus}
            onChange={e => setPromoteStatus(e.target.value)}
            options={['Active', 'Inactive']}
            placeholder={null}
          />

          <Button type="submit" className="mt-2">Update Employee Profile</Button>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationSetup;
