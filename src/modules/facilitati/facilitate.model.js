// Modelul Sequelize pentru tabela facilitate din diagrama ERD (lab 5).
import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

export const Facilitate = sequelize.define(
  'Facilitate',
  {
    id_facilitate: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    denumire: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    tip: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    capacitate_maxima: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    locatie: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: 'facilitate',
    timestamps: false,
  },
);
