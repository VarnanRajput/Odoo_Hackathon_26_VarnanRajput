const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditItem = sequelize.define(
  "AuditItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    auditCycleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    auditorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Verified", "Missing", "Damaged"),
      defaultValue: "Pending",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checkedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "audit_items",
    timestamps: true,
  }
);

module.exports = AuditItem;
