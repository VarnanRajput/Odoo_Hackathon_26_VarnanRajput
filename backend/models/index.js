const sequelize = require("../config/database");

const User = require("./User");
const Department = require("./Department");
const Category = require("./Category");
const Asset = require("./Asset");
const Allocation = require("./Allocation");
const Booking = require("./Booking");
const Maintenance = require("./Maintenance");
const AuditCycle = require("./AuditCycle");
const AuditItem = require("./AuditItem");
const TransferRequest = require("./TransferRequest");
const Notification = require("./Notification");
const ActivityLog = require("./ActivityLog");

// Department ↔ User
Department.hasMany(User, { foreignKey: "departmentId" });
User.belongsTo(Department, { foreignKey: "departmentId" });

// Department ↔ Asset
Department.hasMany(Asset, { foreignKey: "departmentId" });
Asset.belongsTo(Department, { foreignKey: "departmentId" });

// Category ↔ Asset
Category.hasMany(Asset, { foreignKey: "categoryId" });
Asset.belongsTo(Category, { foreignKey: "categoryId" });

// User ↔ Asset (Allocated User)
User.hasMany(Asset, {
  foreignKey: "allocatedTo",
  as: "AllocatedAssets",
});
Asset.belongsTo(User, {
  foreignKey: "allocatedTo",
  as: "AllocatedUser",
});

// Department ↔ Asset (Allocated Department)
Department.hasMany(Asset, {
  foreignKey: "allocatedToDepartmentId",
  as: "AllocatedDeptAssets",
});
Asset.belongsTo(Department, {
  foreignKey: "allocatedToDepartmentId",
  as: "AllocatedDepartment",
});

// Asset ↔ Allocation
Asset.hasMany(Allocation, { foreignKey: "assetId" });
Allocation.belongsTo(Asset, { foreignKey: "assetId" });

// User ↔ Allocation
User.hasMany(Allocation, {
  foreignKey: "employeeId",
  as: "EmployeeAllocations",
});
Allocation.belongsTo(User, {
  foreignKey: "employeeId",
  as: "Employee",
});

// Department ↔ Allocation
Department.hasMany(Allocation, {
  foreignKey: "departmentId",
  as: "DepartmentAllocations",
});
Allocation.belongsTo(Department, {
  foreignKey: "departmentId",
  as: "Department",
});

// Asset ↔ Booking
Asset.hasMany(Booking, { foreignKey: "assetId" });
Booking.belongsTo(Asset, { foreignKey: "assetId" });

// User ↔ Booking
User.hasMany(Booking, { foreignKey: "employeeId" });
Booking.belongsTo(User, { foreignKey: "employeeId" });

// Asset ↔ Maintenance
Asset.hasMany(Maintenance, { foreignKey: "assetId" });
Maintenance.belongsTo(Asset, { foreignKey: "assetId" });

// User ↔ Maintenance (Reporter)
User.hasMany(Maintenance, {
  foreignKey: "reportedBy",
  as: "Reporter",
});
Maintenance.belongsTo(User, {
  foreignKey: "reportedBy",
  as: "Reporter",
});

// AuditCycle ↔ AuditItem
AuditCycle.hasMany(AuditItem, { foreignKey: "auditCycleId", onDelete: "CASCADE" });
AuditItem.belongsTo(AuditCycle, { foreignKey: "auditCycleId" });

// Asset ↔ AuditItem
Asset.hasMany(AuditItem, { foreignKey: "assetId" });
AuditItem.belongsTo(Asset, { foreignKey: "assetId" });

// User ↔ AuditItem (Auditor)
User.hasMany(AuditItem, {
  foreignKey: "auditorId",
  as: "AuditorItems",
});
AuditItem.belongsTo(User, {
  foreignKey: "auditorId",
  as: "Auditor",
});

// Asset ↔ TransferRequest
Asset.hasMany(TransferRequest, { foreignKey: "assetId" });
TransferRequest.belongsTo(Asset, { foreignKey: "assetId" });

// User ↔ TransferRequest (Requester)
User.hasMany(TransferRequest, {
  foreignKey: "requestedById",
  as: "RequestedTransfers",
});
TransferRequest.belongsTo(User, {
  foreignKey: "requestedById",
  as: "Requester",
});

// User ↔ TransferRequest (FromEmployee)
User.hasMany(TransferRequest, {
  foreignKey: "fromEmployeeId",
  as: "FromEmployeeTransfers",
});
TransferRequest.belongsTo(User, {
  foreignKey: "fromEmployeeId",
  as: "FromEmployee",
});

// User ↔ TransferRequest (ToEmployee)
User.hasMany(TransferRequest, {
  foreignKey: "toEmployeeId",
  as: "ToEmployeeTransfers",
});
TransferRequest.belongsTo(User, {
  foreignKey: "toEmployeeId",
  as: "ToEmployee",
});

// User ↔ TransferRequest (Actioner)
User.hasMany(TransferRequest, {
  foreignKey: "actionedById",
  as: "ActionedTransfers",
});
TransferRequest.belongsTo(User, {
  foreignKey: "actionedById",
  as: "Actioner",
});

// Department ↔ TransferRequest (FromDepartment)
Department.hasMany(TransferRequest, {
  foreignKey: "fromDepartmentId",
  as: "FromDeptTransfers",
});
TransferRequest.belongsTo(Department, {
  foreignKey: "fromDepartmentId",
  as: "FromDepartment",
});

// Department ↔ TransferRequest (ToDepartment)
Department.hasMany(TransferRequest, {
  foreignKey: "toDepartmentId",
  as: "ToDeptTransfers",
});
TransferRequest.belongsTo(Department, {
  foreignKey: "toDepartmentId",
  as: "ToDepartment",
});

// User ↔ Notification
User.hasMany(Notification, { foreignKey: "userId" });
Notification.belongsTo(User, { foreignKey: "userId" });

// User ↔ ActivityLog
User.hasMany(ActivityLog, { foreignKey: "userId" });
ActivityLog.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  sequelize,
  User,
  Department,
  Category,
  Asset,
  Allocation,
  Booking,
  Maintenance,
  AuditCycle,
  AuditItem,
  TransferRequest,
  Notification,
  ActivityLog,
};