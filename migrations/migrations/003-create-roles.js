'use strict';

const { withMigration } = require('../utils');

const TABLE_NAME = 'roles';
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
        value: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
        },
      },
      { transaction },
    );
  }),
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(target);
  },
};
