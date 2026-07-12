const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const {
  User,
  Department,
  Category,
  Asset,
  ActivityLog,
  Notification,
  Maintenance,
  Booking,
  Audit
} = require('./models');

const seedData = async () => {
  try {
    console.log('Seeding mockup database as per Excalidraw pages...');
    await connectDB();

    // 1. Clear database first
    if (!global.useInMemoryDb) {
      console.log('Clearing database tables...');
      const mongoose = require('mongoose');
      const collections = Object.keys(mongoose.connection.collections);
      for (const col of collections) {
        await mongoose.connection.collections[col].deleteMany({});
      }
    } else {
      console.log('Clearing in-memory database store...');
      const { store, saveDb } = require('./config/memoryDb');
      store.users = [];
      store.departments = [];
      store.categories = [];
      store.assets = [];
      store.allocations = [];
      store.bookings = [];
      store.maintenances = [];
      store.audits = [];
      store.activitylogs = [];
      store.notifications = [];
      saveDb();
    }

    // 2. Hash Password for Admin & Employees
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const employeePassword = await bcrypt.hash('employee123', salt);

    // 3. Create Admin User
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@assetflow.com',
      password: adminPassword,
      role: 'Admin',
      status: 'Active'
    });

    // 4. Create Mockup Employees
    const priya = await User.create({
      name: 'Priya Sharma',
      email: 'priya@assetflow.com',
      password: employeePassword,
      role: 'Asset Manager',
      status: 'Active'
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'john@assetflow.com',
      password: employeePassword,
      role: 'Employee',
      status: 'Active'
    });

    const raj = await User.create({
      name: 'Raj Patel',
      email: 'raj@assetflow.com',
      password: employeePassword,
      role: 'Department Head',
      status: 'Active'
    });

    // 5. Create Departments
    const deptIT = await Department.create({
      name: 'Information Technology',
      manager: raj._id,
      status: 'Active'
    });

    const deptHR = await Department.create({
      name: 'Human Resources',
      status: 'Active'
    });

    const deptOps = await Department.create({
      name: 'Operations',
      status: 'Active'
    });

    const deptEng = await Department.create({
      name: 'Engineering dept',
      status: 'Active'
    });

    // Link departments to users
    await User.findByIdAndUpdate(john._id, { department: deptEng._id });
    await User.findByIdAndUpdate(priya._id, { department: deptOps._id });
    await User.findByIdAndUpdate(raj._id, { department: deptIT._id });

    // 6. Create Asset Categories
    const catElectronics = await Category.create({
      name: 'Electronics',
      fields: [
        { name: 'warrantyPeriod', type: 'number', label: 'Warranty Period (Months)' },
        { name: 'manufacturer', type: 'text', label: 'Manufacturer' }
      ]
    });

    const catFurniture = await Category.create({
      name: 'Furniture',
      fields: [
        { name: 'material', type: 'text', label: 'Material type' }
      ]
    });

    const catVehicles = await Category.create({
      name: 'Vehicles',
      fields: [
        { name: 'licensePlate', type: 'text', label: 'License Plate' },
        { name: 'insuranceExpiry', type: 'date', label: 'Insurance Expiry Date' }
      ]
    });

    // 7. Create Mockup Assets (Screens 6, 7, 8, 9)
    const laptop003 = await Asset.create({
      name: 'Dell laptop',
      category: catElectronics._id,
      assetTag: 'AF-003',
      serialNumber: 'DELL-E12-X89',
      acquisitionDate: new Date('2025-01-15'),
      acquisitionCost: 1200,
      condition: 'Good',
      location: 'Desk E12',
      shared: false,
      status: 'Available'
    });

    const chair9921 = await Asset.create({
      name: 'Office chair',
      category: catFurniture._id,
      assetTag: 'AF-9921',
      serialNumber: 'CHAIR-GESTURE-E14',
      acquisitionDate: new Date('2025-06-10'),
      acquisitionCost: 450,
      condition: 'Good',
      location: 'Desk E14',
      shared: false,
      status: 'Available'
    });

    const monitor9838 = await Asset.create({
      name: 'Monitor',
      category: catElectronics._id,
      assetTag: 'AF-9838',
      serialNumber: 'MONITOR-DELL-E15',
      acquisitionDate: new Date('2025-11-20'),
      acquisitionCost: 350,
      condition: 'Good',
      location: 'Desk E15',
      shared: false,
      status: 'Available'
    });

    const bulb0062 = await Asset.create({
      name: 'Projector bulb',
      category: catElectronics._id,
      assetTag: 'AF-0062',
      serialNumber: 'PROJ-BULB-0062',
      acquisitionDate: new Date('2026-02-01'),
      acquisitionCost: 150,
      condition: 'Poor',
      location: 'Conference Room Alpha',
      shared: false,
      status: 'Under Maintenance'
    });

    const ac003 = await Asset.create({
      name: 'ac unit',
      category: catElectronics._id,
      assetTag: 'AF-003', // Duplicated tags as per mockup
      serialNumber: 'AC-VOLTAS-COMPRESSOR',
      acquisitionDate: new Date('2024-03-01'),
      acquisitionCost: 800,
      condition: 'Damaged',
      location: 'Main Hallway Office',
      shared: false,
      status: 'Available'
    });

    const forklift0078 = await Asset.create({
      name: 'forklift',
      category: catVehicles._id,
      assetTag: 'AF-0078',
      serialNumber: 'TOYOTA-FORKLIFT-0078',
      acquisitionDate: new Date('2023-08-10'),
      acquisitionCost: 18000,
      condition: 'Good',
      location: 'Warehouse Gate 4',
      shared: false,
      status: 'Under Maintenance'
    });

    const printer897 = await Asset.create({
      name: 'Printer Jam',
      category: catElectronics._id,
      assetTag: 'AF-897',
      serialNumber: 'HP-LASERJET-897',
      acquisitionDate: new Date('2025-05-15'),
      acquisitionCost: 600,
      condition: 'Good',
      location: 'Print Room 2',
      shared: false,
      status: 'Under Maintenance'
    });

    const chair873 = await Asset.create({
      name: 'Chair repair',
      category: catFurniture._id,
      assetTag: 'AF-873',
      serialNumber: 'CHAIR-RECEPTION-873',
      acquisitionDate: new Date('2024-12-01'),
      acquisitionCost: 120,
      condition: 'Good',
      location: 'Reception Area Lobby',
      shared: false,
      status: 'Available'
    });

    // Shared Bookable Resources
    const confRoomB2 = await Asset.create({
      name: 'Conference room B2',
      category: catFurniture._id,
      assetTag: 'B2-CONF',
      serialNumber: 'ROOM-B2-MEETING',
      acquisitionDate: new Date('2025-01-01'),
      acquisitionCost: 10000,
      condition: 'New',
      location: 'Ground Floor Wing B',
      shared: true,
      status: 'Available'
    });

    const van343 = await Asset.create({
      name: 'Van AF-343',
      category: catVehicles._id,
      assetTag: 'AF-343',
      serialNumber: 'MAHINDRA-VAN-343',
      acquisitionDate: new Date('2024-05-10'),
      acquisitionCost: 15000,
      condition: 'Good',
      location: 'Parking Garage Wing A',
      shared: true,
      status: 'Available'
    });

    // 8. Seed Bookings as per Screen 6 (9:00 - 10:00 booking)
    const today = new Date().toISOString().split('T')[0];
    await Booking.create({
      resourceId: confRoomB2._id,
      bookedBy: john._id,
      startTime: `${today}T09:00:00.000Z`,
      endTime: `${today}T10:00:00.000Z`,
      purpose: 'Procurement Team',
      status: 'Confirmed'
    });

    // 9. Seed Maintenance requests as per Screen 7 Kanban Board columns
    await Maintenance.create({
      asset: bulb0062._id,
      reportedBy: john._id,
      issueDescription: 'Projector bulb not turning on',
      priority: 'High',
      status: 'Pending'
    });

    await Maintenance.create({
      asset: ac003._id,
      reportedBy: priya._id,
      issueDescription: 'ac unit noisy compressor',
      priority: 'Low',
      status: 'Approved'
    });

    await Maintenance.create({
      asset: forklift0078._id,
      reportedBy: raj._id,
      issueDescription: 'forklift check',
      priority: 'High',
      status: 'Approved',
      technician: 'R varma'
    });

    await Maintenance.create({
      asset: printer897._id,
      reportedBy: john._id,
      issueDescription: 'Printer Jam parts ordered',
      priority: 'Medium',
      status: 'In Progress'
    });

    const resolvedTicket = await Maintenance.create({
      asset: chair873._id,
      reportedBy: priya._id,
      issueDescription: 'Chair repair resolved 7 Jul',
      priority: 'Low',
      status: 'Resolved'
    });
    // Set Resolved date to July 7, 2026
    await Maintenance.findByIdAndUpdate(resolvedTicket._id, {
      updatedAt: new Date('2026-07-07T12:00:00.000Z')
    });

    // 10. Seed Audit cycle matching Screen 8 expected items
    await Audit.create({
      title: 'Q3 audit',
      scopeDepartment: deptEng._id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-15'),
      auditors: [admin._id, john._id],
      status: 'Active',
      items: [
        {
          asset: laptop003._id,
          verificationStatus: 'Verified',
          notes: 'Physically checked at Desk E12.',
          verifiedAt: new Date()
        },
        {
          asset: chair9921._id,
          verificationStatus: 'Missing',
          notes: 'Asset not located at Desk E14.',
          verifiedAt: new Date()
        },
        {
          asset: monitor9838._id,
          verificationStatus: 'Damaged',
          notes: 'Monitor screen cracked at Desk E15.',
          verifiedAt: new Date()
        }
      ]
    });

    // 11. Seed Notifications matching Screen 10
    const now = new Date();
    await Notification.create({
      recipient: admin._id,
      title: 'Asset Assigned',
      message: 'Laptop AF-0014 assigned to Priya shah',
      type: 'Asset Assigned',
      timestamp: new Date(now.getTime() - 2 * 60 * 1000) // 2m ago
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Maintenance Approved',
      message: 'Maintenance request AF-0055 approved',
      type: 'Maintenance Approved',
      timestamp: new Date(now.getTime() - 18 * 60 * 1000) // 18m ago
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Booking Confirmed',
      message: 'Booking confirmed : Room B2 : 2:00 to 3:00 PM',
      type: 'Booking Confirmed',
      timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1h ago
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Transfer Approved',
      message: 'Transfer approved : AF-0033 to facilities dept',
      type: 'Transfer Approved',
      timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3h ago
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Overdue Return',
      message: 'Overdue return : AF-0021 was due 3 days ago',
      type: 'Overdue Return',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1d ago
    });

    await Notification.create({
      recipient: admin._id,
      title: 'Audit Discrepancy',
      message: 'audit discrepancy flagged : AF-0088 damaged',
      type: 'Audit Discrepancy',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2d ago
    });

    await ActivityLog.create({
      action: 'Database Seeded',
      details: 'Populated mockup data as per Excalidraw UI specs.',
      performedBy: admin._id
    });

    // Make sure we write mock store data to db.json file if in-memory
    if (global.useInMemoryDb) {
      const { saveDb } = require('./config/memoryDb');
      saveDb();
    }

    console.log('Database mockup seeding successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
