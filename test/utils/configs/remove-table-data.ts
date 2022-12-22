import * as modules from 'src/models';

export const removeTablesData = async () => {
  console.time('drop tables data');

  const tables = Object.keys(modules);
  await Promise.all(
    tables.map((tableName) =>
      modules[tableName].destroy({
        truncate: true,
        cascade: true,
        force: true,
      }),
    ),
  );
  console.timeEnd('drop tables data');
};