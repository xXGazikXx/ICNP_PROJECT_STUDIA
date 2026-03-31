const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  imie: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nazwisko: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'prowadzacy', 'student'),
    allowNull: false,
    defaultValue: 'student',
  },
  prowadzacy_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

User.belongsTo(User, { as: 'prowadzacy', foreignKey: 'prowadzacy_id' });
User.hasMany(User, { as: 'studenci', foreignKey: 'prowadzacy_id' });

module.exports = User;
