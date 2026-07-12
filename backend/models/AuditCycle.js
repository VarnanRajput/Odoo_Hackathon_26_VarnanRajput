const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AuditCycle = sequelize.define(
  "AuditCycle",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    scopeType: {
      type: DataTypes.ENUM("Department", "Location"),
      allowNull: false,
    },
    scopeValue: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Draft", "Active", "Closed"),
      defaultValue: "Draft",
    },
    auditorIds: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "audit_cycles",
    timestamps: true,
  }
);

module.exports = AuditCycle;
