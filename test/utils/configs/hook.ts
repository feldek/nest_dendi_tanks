import { Role } from './../../../src/controllers/auth/roles.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import supertest from 'supertest';

let initTestApp: INestApplication;

export let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(Role)
    .useValue({ canActivate: () => true })
    .compile();

  initTestApp = moduleFixture.createNestApplication();
  await initTestApp.init();

  request = supertest(initTestApp.getHttpServer());
});

afterAll(async() => await initTestApp.close());
