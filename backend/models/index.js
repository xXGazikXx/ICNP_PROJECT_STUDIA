const sequelize = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');

module.exports = {
  sequelize,
  User,
  Patient,
};
