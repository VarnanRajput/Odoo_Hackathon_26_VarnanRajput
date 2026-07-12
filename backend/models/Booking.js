const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Booking = sequelize.define(
  "Booking",
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
      allowNull: false,
    },

    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    purpose: {
      type: DataTypes.TEXT,
    },

    status: {
      type: DataTypes.ENUM(
        "Upcoming",
        "Ongoing",
        "Completed",
        "Cancelled"
      ),
      defaultValue: "Upcoming",
    }

  },
  {
    tableName: "bookings",
    timestamps: true,
  }
);

module.exports = Booking;