'use strict';

const { withMigration } = require('../utils');

const TABLE_NAME = 'Users';
const DB_SCHEMA = process.env.DB_SCHEMA;
const target = { tableName: TABLE_NAME, schema: DB_SCHEMA };

module.exports = {
  up: withMigration((queryInterface, DataTypes, transaction) => {
    return queryInterface.createTable(
      target,
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          unique: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        banned: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        banReason: {
          type: DataTypes.STRING,
        },
        createdAt: {
          allowNull: false,
          type: DataTypes.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: DataTypes.DATE,
        },
      },
      { transaction },
    );
  }),
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(target);
  },
};
