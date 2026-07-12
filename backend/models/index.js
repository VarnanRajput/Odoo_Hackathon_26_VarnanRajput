const mongoose = require('mongoose');
const { MockModel } = require('../config/memoryDb');

// =========================================================================
// 1. DATABASE SCHEMAS DEFINITION
// =========================================================================

// User / Employee Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  role: { 
    type: String, 
    enum: ['Admin', 'Asset Manager', 'Department Head', 'Employee'], 
    default: 'Employee' 
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Department Schema
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Asset Category Schema
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  fields: { type: Array, default: [] } // custom attributes (e.g. { name: 'warranty', type: 'number', label: 'Warranty (months)' })
}, { timestamps: true });

// Asset Schema
const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  assetTag: { type: String, required: true, unique: true },
  serialNumber: { type: String },
  acquisitionDate: { type: Date },
  acquisitionCost: { type: Number },
  condition: { 
    type: String, 
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'], 
    default: 'Good' 
  },
  location: { type: String },
  photo: { type: String },
  shared: { type: Boolean, default: false }, // if true, it's a bookable resource
  status: { 
    type: String, 
    enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'], 
    default: 'Available' 
  }
}, { timestamps: true });

// Allocation Schema
const AllocationSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date, default: null },
  status: { type: String, enum: ['Active', 'Returned', 'Overdue'], default: 'Active' },
  checkOutNotes: { type: String },
  checkInNotes: { type: String }
}, { timestamps: true });

// Booking Schema
const BookingSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'], 
    default: 'Upcoming' 
  },
  purpose: { type: String }
}, { timestamps: true });

// Maintenance Schema
const MaintenanceSchema = new mongoose.Schema({
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueDescription: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  photo: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  technician: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Audit Cycle Schema
const AuditSchema = new mongoose.Schema({
  title: { type: String, required: true },
  scopeDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  scopeLocation: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  auditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Draft', 'Active', 'Completed'], default: 'Draft' },
  items: [{
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    auditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: { 
      type: String, 
      enum: ['Pending', 'Verified', 'Missing', 'Damaged'], 
      default: 'Pending' 
    },
    notes: { type: String, default: '' },
    verifiedAt: { type: Date, default: null }
  }]
}, { timestamps: true });

// Activity Log Schema
const ActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  timestamp: { type: Date, default: Date.now }
});

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'General' },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

// =========================================================================
// 2. MONGOOSE MODELS REGISTRATION
// =========================================================================

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongooseDepartment = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const MongooseCategory = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const MongooseAsset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
const MongooseAllocation = mongoose.models.Allocation || mongoose.model('Allocation', AllocationSchema);
const MongooseBooking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const MongooseMaintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
const MongooseAudit = mongoose.models.Audit || mongoose.model('Audit', AuditSchema);
const MongooseActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);
const MongooseNotification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// =========================================================================
// 3. HYBRID MODEL FACTORY FOR SEAMLESS SWAP
// =========================================================================

function wrapModel(mongooseModel, collectionName) {
  // Create a handler proxy that routes to either Mongoose or MockModel dynamically
  return new Proxy({}, {
    get: (target, prop) => {
      // Switch destination database context dynamically
      if (global.useInMemoryDb) {
        const mockInstance = new MockModel(collectionName);
        return mockInstance[prop] ? mockInstance[prop].bind(mockInstance) : undefined;
      }
      return mongooseModel[prop] ? mongooseModel[prop].bind(mongooseModel) : undefined;
    }
  });
}

const User = wrapModel(MongooseUser, 'users');
const Department = wrapModel(MongooseDepartment, 'departments');
const Category = wrapModel(MongooseCategory, 'categories');
const Asset = wrapModel(MongooseAsset, 'assets');
const Allocation = wrapModel(MongooseAllocation, 'allocations');
const Booking = wrapModel(MongooseBooking, 'bookings');
const Maintenance = wrapModel(MongooseMaintenance, 'maintenances');
const Audit = wrapModel(MongooseAudit, 'audits');
const ActivityLog = wrapModel(MongooseActivityLog, 'activitylogs');
const Notification = wrapModel(MongooseNotification, 'notifications');

module.exports = {
  User,
  Department,
  Category,
  Asset,
  Allocation,
  Booking,
  Maintenance,
  Audit,
  ActivityLog,
  Notification
};
