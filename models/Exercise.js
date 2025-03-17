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
    type: DataTypes.DATEONLY, // Usa DATEONLY para fechas sin horas
    defaultValue: () => new Date().toISOString().split('T')[0], // Asignar fecha actual en formato yyyy-mm-dd
    get() {
      // Al obtener la fecha, devolverla en formato DateString()
      const date = this.getDataValue('date');
      return new Date(date).toDateString();
    }
  },
});

Exercise.belongsTo(User, { foreignKey: 'userId' });

module.exports = Exercise;