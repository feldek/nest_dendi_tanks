require('dotenv').config();

import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';

let app: INestApplication;

beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = module.createNestApplication();
  app.useWebSocketAdapter(new WsAdapter(app));
  app.listen(8000);

  await app.init();
});

afterAll(async () => {
  await app.close();
});
