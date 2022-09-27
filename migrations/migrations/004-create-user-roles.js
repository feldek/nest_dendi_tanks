'use strict';

const { withMigration } = require('../utils');

const TABLE_NAME = 'user_roles';
const DB_SCHEMA = process.env.DB_SCHEMA;
const target = { tableName: TABLE_NAME, schema: DB_SCHEMA };

module.exports = {
  up: withMigration((queryInterface, DataTypes, transaction) => {
    return queryInterface.createTable(
      target,
      {
        userId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          references: {
            model: 'users',
            key: 'id',
          },
        },
        roleId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          references: {
            model: 'roles',
            key: 'id',
          },
        },
      },
      { transaction },
    );
  }),
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(target);
  },
};
