const sequelize = require('./database');

async function connectDB() {
  await sequelize.authenticate();
  await sequelize.sync();
  return sequelize;
}

module.exports = connectDB;
module.exports.sequelize = sequelize;
