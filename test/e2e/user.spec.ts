import { request } from 'test/utils/configs/hook';

import { ROLES } from 'src/constants';
import { RoleEntity } from '../../src/models/roles.model';
import { removeTablesData } from 'test/utils/configs/remove-table-data';

beforeEach(async () => {
  await removeTablesData();

  await RoleEntity.bulkCreate([
    { value: ROLES.ADMIN, description: 'test admin' },
    { value: ROLES.USER, description: 'test roles' },
  ]);
});

describe('user/', () => {
  it('/ (get) created and return users', async () => {
    const numberUsers = 10;
    const users = Array.from(Array(numberUsers).keys(), (x) => ({
      email: `test${x}@gmail.com`,
      password: 'secretPassword',
    }));

    const res = await Promise.all(
      users.map(async (userData) => await request.post('/auth/sign-up').send(userData).expect(201)),
    );

    const { body } = await request
      .get('/users')
      .set({ access_token: res[0].body.access_token })
      .expect(200);
    expect(body.length).toBe(numberUsers);
    expect(body[0].email).toMatch(/@gmail.com/);
  });
});
