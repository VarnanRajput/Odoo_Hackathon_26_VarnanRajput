const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: "Department already exists",
      },
      validate: {
        notEmpty: {
          msg: "Department name is required",
        },
      },
    },

    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: "Department code already exists",
      },
    },

    parentDepartmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    headId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      defaultValue: "Active",
    },
  },
  {
    tableName: "departments",
    timestamps: true,
  }
);

module.exports = Department;