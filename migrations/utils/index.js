const withMigration = (migrationFunc) => {
  return async (queryInterface, DataTypes) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await migrationFunc(queryInterface, DataTypes, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };
};

module.exports = {
  withMigration,
};
