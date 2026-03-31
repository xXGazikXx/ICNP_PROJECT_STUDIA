const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  imie: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nazwisko: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pesel: {
    type: DataTypes.STRING(11),
    allowNull: false,
  },
  lokalizacja: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('aktualny', 'wypisany', 'archiwum'),
    allowNull: false,
    defaultValue: 'aktualny',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'patients',
  timestamps: true,
  underscored: true,
});

Patient.belongsTo(User, { as: 'autor', foreignKey: 'created_by' });
User.hasMany(Patient, { foreignKey: 'created_by' });

module.exports = Patient;
