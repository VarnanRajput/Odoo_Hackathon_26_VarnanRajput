const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const { User, Department, Category, Asset, ActivityLog } = require('./models');

const seedData = async () => {
  try {
    console.log('Seeding database...');
    await connectDB();

    // 1. Clear database first if we are using Mongoose (or in memory)
    if (!global.useInMemoryDb) {
      console.log('Clearing database tables...');
      // Clean Mongoose collections
      const mongoose = require('mongoose');
      const collections = Object.keys(mongoose.connection.collections);
      for (const col of collections) {
        await mongoose.connection.collections[col].deleteMany({});
      }
    } else {
      console.log('Clearing in-memory database...');
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

    // 2. Hash Password for Admin
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

    console.log('Seeded User: admin@assetflow.com / admin123 (Admin)');

    // 4. Create some test Employees
    const emp1 = await User.create({
      name: 'John Doe',
      email: 'john@assetflow.com',
      password: employeePassword,
      role: 'Employee',
      status: 'Active'
    });

    const emp2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@assetflow.com',
      password: employeePassword,
      role: 'Asset Manager',
      status: 'Active'
    });

    const emp3 = await User.create({
      name: 'Raj Patel',
      email: 'raj@assetflow.com',
      password: employeePassword,
      role: 'Department Head',
      status: 'Active'
    });

    console.log('Seeded User: john@assetflow.com / employee123 (Employee)');
    console.log('Seeded User: priya@assetflow.com / employee123 (Asset Manager)');
    console.log('Seeded User: raj@assetflow.com / employee123 (Department Head)');

    // 5. Create Departments
    const deptIT = await Department.create({
      name: 'Information Technology',
      manager: emp3._id,
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

    console.log('Seeded Departments: IT, HR, Operations');

    // Update employees department
    await User.findByIdAndUpdate(emp1._id, { department: deptIT._id });
    await User.findByIdAndUpdate(emp2._id, { department: deptOps._id });
    await User.findByIdAndUpdate(emp3._id, { department: deptIT._id });

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

    console.log('Seeded Categories: Electronics, Furniture, Vehicles');

    // 7. Create Assets
    const asset1 = await Asset.create({
      name: 'MacBook Pro 16"',
      category: catElectronics._id,
      assetTag: 'AF-0001',
      serialNumber: 'C02F89XXMD6M',
      acquisitionDate: new Date('2026-01-15'),
      acquisitionCost: 2499,
      condition: 'New',
      location: 'IT Lab Room 402',
      shared: false,
      status: 'Available'
    });

    const asset2 = await Asset.create({
      name: 'Conference Room Alpha Projector',
      category: catElectronics._id,
      assetTag: 'AF-0002',
      serialNumber: 'EPSON-823904',
      acquisitionDate: new Date('2025-06-10'),
      acquisitionCost: 899,
      condition: 'Good',
      location: 'Conference Room Alpha',
      shared: true,
      status: 'Available'
    });

    const asset3 = await Asset.create({
      name: 'Ergonomic Desk Chair',
      category: catFurniture._id,
      assetTag: 'AF-0003',
      serialNumber: 'STEELCASE-GESTURE',
      acquisitionDate: new Date('2025-11-20'),
      acquisitionCost: 1100,
      condition: 'Good',
      location: 'Main Workspace Floor 2',
      shared: false,
      status: 'Available'
    });

    const asset4 = await Asset.create({
      name: 'Company Delivery Van',
      category: catVehicles._id,
      assetTag: 'AF-0004',
      serialNumber: 'FORD-TRANSIT-2026',
      acquisitionDate: new Date('2026-02-01'),
      acquisitionCost: 35000,
      condition: 'New',
      location: 'Parking Garage Slot 12',
      shared: true,
      status: 'Available'
    });

    console.log('Seeded Assets: MacBook Pro, Projector, Ergonomic Chair, Delivery Van');

    await ActivityLog.create({
      action: 'Database Seeded',
      details: 'Populated default Admin, test employees, departments, categories, and assets.',
      performedBy: admin._id
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
