// Modelul Sequelize pentru tabela slot (migrarea 0003). Ocuparea nu se
// memoreaza aici: stare are doar Liber sau Mentenanta (ADR 0003).
import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

export const Slot = sequelize.define(
  'Slot',
  {
    id_slot: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_facilitate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ora_inceput: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ora_sfarsit: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    stare: {
      type: DataTypes.ENUM('Liber', 'Mentenanta'),
      allowNull: false,
      defaultValue: 'Liber',
    },
  },
  {
    tableName: 'slot',
    timestamps: false,
  },
);
