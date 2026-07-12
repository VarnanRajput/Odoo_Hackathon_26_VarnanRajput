const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Asset = sequelize.define(
  "Asset",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    assetCode: {
      type: DataTypes.STRING(30),
      unique: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    serialNumber: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    purchaseDate: {
      type: DataTypes.DATEONLY,
    },

    purchaseCost: {
      type: DataTypes.DECIMAL(10,2),
    },

    location: {
      type: DataTypes.STRING,
    },

    status: {
      type: DataTypes.ENUM(
        "Available",
        "Allocated",
        "Reserved",
        "Under Maintenance",
        "Lost",
        "Retired",
        "Disposed"
      ),
      defaultValue: "Available",
    },

    condition: {
      type: DataTypes.ENUM(
        "Excellent",
        "Good",
        "Fair",
        "Poor",
        "Damaged"
      ),
      defaultValue: "Excellent",
    },

    photo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    isBookable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    customFields: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    allocatedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    allocatedToDepartmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "assets",
    timestamps: true,
  }
);

module.exports = Asset;