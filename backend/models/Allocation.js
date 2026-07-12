const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Allocation = sequelize.define(
  "Allocation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    allocatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    allocationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    expectedReturnDate: {
      type: DataTypes.DATEONLY,
    },

    actualReturnDate: {
      type: DataTypes.DATEONLY,
    },

    remarks: {
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.ENUM(
        "Allocated",
        "Returned"
      ),
      defaultValue: "Allocated",
    }

  },
  {
    tableName: "allocations",
    timestamps: true,
  }
);

module.exports = Allocation;