// Modelul Sequelize pentru tabela regula_acces (migrarea 0006).
import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

/** Categoriile de utilizatori, in ordinea tipului categorie_utilizator. */
export const CATEGORII_UTILIZATOR = [
  'Student',
  'CadruDidactic',
  'PersonalAdministrativ',
];

/** Campurile unei reguli de acces care intra si ies din API. */
export const CAMPURI_REGULA = [
  'categorie_utilizator',
  'ore_maxim_saptamana',
  'prioritate',
  'zile_avans_maxim',
];

export const RegulaAcces = sequelize.define(
  'RegulaAcces',
  {
    id_regula: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_facilitate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categorie_utilizator: {
      type: DataTypes.ENUM(...CATEGORII_UTILIZATOR),
      allowNull: false,
    },
    ore_maxim_saptamana: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prioritate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    zile_avans_maxim: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'regula_acces',
    timestamps: false,
  },
);
