const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Exercise = sequelize.define('Exercise', {
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    defaultValue: new Date().toDateString(),
  },
});

Exercise.belongsTo(User, { foreignKey: 'userId' });

module.exports = Exercise;