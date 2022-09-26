'use strict';

const DB_SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    return queryInterface.createSchema(DB_SCHEMA);
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.dropSchema(DB_SCHEMA);
  },
};
