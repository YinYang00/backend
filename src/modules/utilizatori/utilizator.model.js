// Modelul Sequelize pentru tabela utilizator (migrarea 0002).
import { DataTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';

export const Utilizator = sequelize.define(
  'Utilizator',
  {
    id_utilizator: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nume: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    parola_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    categorie: {
      type: DataTypes.ENUM('Student', 'CadruDidactic', 'PersonalAdministrativ'),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('Utilizator', 'Administrator'),
      allowNull: false,
      defaultValue: 'Utilizator',
    },
    data_crearii: {
      type: DataTypes.DATE,
      allowNull: false,
      // Ora o pune PostgreSQL, ca la orice INSERT facut direct in SQL.
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'utilizator',
    timestamps: false,
  },
);
