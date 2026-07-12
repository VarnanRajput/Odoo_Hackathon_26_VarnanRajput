const { MockModel } = require("../config/memoryDb");

// Check if we are running in-memory DB mode (e.g. if MySQL is out of memory or connection fails)
if (global.useInMemoryDb) {
  function wrapModel(collectionName) {
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          const mockInstance = new MockModel(collectionName);
          return mockInstance[prop] ? mockInstance[prop].bind(mockInstance) : undefined;
        },
      }
    );
  }

  module.exports = {
    User: wrapModel("users"),
    Department: wrapModel("departments"),
    Category: wrapModel("categories"),
    Asset: wrapModel("assets"),
    Allocation: wrapModel("allocations"),
    Booking: wrapModel("bookings"),
    Maintenance: wrapModel("maintenances"),
    Audit: wrapModel("audits"),
    ActivityLog: wrapModel("activitylogs"),
    Notification: wrapModel("notifications"),
  };
} else {
  // Use MySQL Sequelize Models
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
  const ActivityLog = require("./ActivityLog");
  const Notification = require("./Notification");
  const TransferRequest = require("./TransferRequest");

  User.belongsTo(Department, { foreignKey: "departmentId", as: "Department" });
  Department.hasMany(User, { foreignKey: "departmentId", as: "Users" });

  Department.hasMany(Asset, { foreignKey: "departmentId", as: "Assets" });
  Category.hasMany(Asset, { foreignKey: "categoryId", as: "Assets" });
  Asset.belongsTo(Department, { foreignKey: "departmentId", as: "Department" });
  Asset.belongsTo(Category, { foreignKey: "categoryId", as: "Category" });
  Asset.belongsTo(User, { foreignKey: "allocatedTo", as: "AllocatedUser" });
  Asset.hasMany(Allocation, { foreignKey: "assetId", as: "Allocations" });
  Asset.hasMany(Maintenance, { foreignKey: "assetId", as: "MaintenanceRequests" });

  Allocation.belongsTo(Asset, { foreignKey: "assetId", as: "Asset" });
  Allocation.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });
  Allocation.belongsTo(Department, { foreignKey: "departmentId", as: "Department" });
  Allocation.belongsTo(User, { foreignKey: "allocatedBy", as: "AllocatedByUser" });

  Booking.belongsTo(Asset, { foreignKey: "assetId", as: "Asset" });
  Booking.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

  Maintenance.belongsTo(Asset, { foreignKey: "assetId", as: "Asset" });
  Maintenance.belongsTo(User, { foreignKey: "reportedBy", as: "Reporter" });
  Maintenance.belongsTo(User, { foreignKey: "assignedTo", as: "AssignedTo" });

  AuditCycle.hasMany(AuditItem, { foreignKey: "auditCycleId", as: "AuditItems" });
  AuditItem.belongsTo(AuditCycle, { foreignKey: "auditCycleId", as: "AuditCycle" });
  AuditItem.belongsTo(Asset, { foreignKey: "assetId", as: "Asset" });
  AuditItem.belongsTo(User, { foreignKey: "auditorId", as: "Auditor" });

  ActivityLog.belongsTo(User, { foreignKey: "userId", as: "User" });
  Notification.belongsTo(User, { foreignKey: "userId", as: "User" });

  TransferRequest.belongsTo(Asset, { foreignKey: "assetId", as: "Asset" });
  TransferRequest.belongsTo(User, { foreignKey: "fromEmployeeId", as: "FromEmployee" });
  TransferRequest.belongsTo(User, { foreignKey: "toEmployeeId", as: "ToEmployee" });
  TransferRequest.belongsTo(Department, { foreignKey: "fromDepartmentId", as: "FromDepartment" });
  TransferRequest.belongsTo(Department, { foreignKey: "toDepartmentId", as: "ToDepartment" });
  TransferRequest.belongsTo(User, { foreignKey: "requestedById", as: "RequestedBy" });
  TransferRequest.belongsTo(User, { foreignKey: "actionedById", as: "ActionedBy" });

  // Add compatibility aliases for frontend compatibility (MongoDB Mongoose mapping)
  const models = {
    User,
    Department,
    Category,
    Asset,
    Allocation,
    Booking,
    Maintenance,
    AuditCycle,
    AuditItem,
    ActivityLog,
    Notification,
    TransferRequest,
  };

  for (const modelName of Object.keys(models)) {
    const model = models[modelName];
    if (model && model.prototype) {
      model.prototype.toJSON = function () {
        const values = { ...this.get() };

        // Standard Mongo ID alias
        values._id = values.id;

        // Model-specific compatibility aliases
        if (modelName === "Asset") {
          values.assetTag = values.assetCode;
          values.acquisitionDate = values.purchaseDate;
          values.acquisitionCost = values.purchaseCost;
          values.shared = values.isBookable;
          values.category = values.categoryId;
        }
        if (modelName === "Department") {
          values.manager = values.headId;
          values.parentDepartment = values.parentDepartmentId;
        }
        if (modelName === "Category") {
          values.fields = values.customFields || [];
        }
        if (modelName === "Allocation") {
          values.asset = values.assetId;
          values.assignedTo = values.employeeId;
          values.assignedDepartment = values.departmentId;
          values.checkOutNotes = values.remarks;
          values.checkInNotes = values.remarks;
        }
        if (modelName === "Booking") {
          values.resource = values.assetId;
          values.bookedBy = values.employeeId;
        }
        if (modelName === "Maintenance") {
          values.asset = values.assetId;
          values.issueDescription = values.issue;
        }
        if (modelName === "AuditCycle") {
          values.title = values.name;
          values.scopeDepartment = values.scopeType === "Department" ? values.scopeValue : null;
          values.scopeLocation = values.scopeType === "Location" ? values.scopeValue : "";
          values.auditors = values.auditorIds || [];
          values.items = values.AuditItems || [];
        }
        if (modelName === "AuditItem") {
          values.asset = values.assetId;
          values.auditor = values.auditorId;
          values.verificationStatus = values.status;
          values.notes = values.remarks;
        }
        if (modelName === "ActivityLog") {
          values.performedBy = values.userId;
        }
        if (modelName === "Notification") {
          values.recipient = values.userId;
          values.title = values.type;
        }
        return values;
      };
    }
  }

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
    ActivityLog,
    Notification,
    TransferRequest,
  };
}
