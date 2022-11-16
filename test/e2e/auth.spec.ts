import { ROLES } from 'src/constants';
import { RoleEntity } from './../../src/models/roles.model';
import { request } from 'test/utils/configs/hook';
import { removeTablesData } from 'test/utils/configs/remove-table-data';

const loginDto = {
  email: 'test@gmail.com',
  password: 'secretPassword',
};

beforeEach(async () => {
  await removeTablesData();

  await RoleEntity.bulkCreate([
    { value: ROLES.ADMIN, description: 'test admin' },
    { value: ROLES.USER, description: 'test roles' },
  ]);
});

describe('auth/', () => {
  // let access_token: string;
  it('/sign-up', async () => {
    const { body } = await request.post('/auth/sign-up').send(loginDto).expect(201);
    expect(typeof body.access_token).toBe('string');
  });
  it('/sign-up this user already exist', async () => {
    await request.post('/auth/sign-up').send(loginDto).expect(201);
    await request.post('/auth/sign-up').send(loginDto).expect(400);
  });
  it('/sign-in', async () => {
    await request.post('/auth/sign-up').send(loginDto).expect(201);
    const { body } = await request.post('/auth/sign-in').send(loginDto).expect(201);
    expect(typeof body.access_token).toBe('string');
  });
});
