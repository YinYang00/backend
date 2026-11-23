// Modelul Sequelize pentru tabela rezervare (migrarea 0004).
import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

/** Starile memorate ale unei rezervari (ADR 0002), ca in migrarea 0004. */
export const STARI_REZERVARE = [
  'Confirmata',
  'PrezentaConfirmata',
  'Anulata',
  'Neonorata',
];

/** Starea unei rezervari anulate, care nu mai ocupa loc (GLOSSARY.md, „Anulare”). */
export const STARE_ANULATA = 'Anulata';

/** Starile in care o rezervare ocupa un loc (GLOSSARY.md, „Rezervare activa”). */
export const STARI_ACTIVE = ['Confirmata', 'PrezentaConfirmata'];

export const Rezervare = sequelize.define(
  'Rezervare',
  {
    id_rezervare: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_utilizator: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_slot: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stare_rezervare: {
      type: DataTypes.ENUM(...STARI_REZERVARE),
      allowNull: false,
      defaultValue: 'Confirmata',
    },
    cod_qr: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    data_crearii: {
      type: DataTypes.DATE,
      allowNull: false,
      // Ora o pune PostgreSQL, ca la orice INSERT facut direct in SQL.
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'rezervare',
    timestamps: false,
  },
);
