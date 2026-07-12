const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Maintenance = sequelize.define(
"Maintenance",
{

id:{
type:DataTypes.INTEGER,
primaryKey:true,
autoIncrement:true
},

assetId:{
type:DataTypes.INTEGER,
allowNull:false
},

reportedBy:{
type:DataTypes.INTEGER,
allowNull:false
},

assignedTo:{
type:DataTypes.INTEGER
},

issue:{
type:DataTypes.TEXT,
allowNull:false
},

priority:{
type:DataTypes.ENUM(
"Low",
"Medium",
"High",
"Critical"
),
defaultValue:"Medium"
},

status:{
type:DataTypes.ENUM(
"Pending",
"Approved",
"Rejected",
"Technician Assigned",
"In Progress",
"Resolved"
),
defaultValue:"Pending"
}

},
{

tableName:"maintenance",

timestamps:true

}
);

module.exports=Maintenance;