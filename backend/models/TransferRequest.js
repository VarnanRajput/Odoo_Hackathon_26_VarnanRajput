const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TransferRequest = sequelize.define(
  "TransferRequest",
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
    fromEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    toEmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fromDepartmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    toDepartmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    requestedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actionedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      defaultValue: "Pending",
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "transfer_requests",
    timestamps: true,
  }
);

module.exports = TransferRequest;
