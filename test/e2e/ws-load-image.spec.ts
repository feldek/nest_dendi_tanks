import 'test/utils/configs/ws-hook';

import { WsClient } from '../utils/ws-client/ws-client';
import { LOAD_IMAGE } from 'src/interfaces/ws';
import fs from 'fs';

//crutch
//for run this test need uncomment method listenBuffer in ws.gateway
describe.skip('ws', () => {
  const userIds = [10];
  let users: WsClient[] = [];

  beforeEach(() => {
    global.console = require('console');
  });

  beforeAll(async () => {
    users = userIds.map((userId) => new WsClient(userId, false));

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 100);
    });
  });

  afterAll(async () => {
    users.forEach((user) => user.connection.close());
  });

  it('LOAD_IMAGE_TEST ', async () => {
    const extension = 'jpg';
    const newFileName = 'new-test-image';

    const imagePath = `${__dirname}/test-image.jpg`;
    const newImagePath = `${__dirname}/${newFileName}.${extension}`;

    const bufferImage = await fs.promises.readFile(imagePath);
    const message = {
      payload: {
        extension,
        name: newFileName,
        buffer: bufferImage,
      },
    };

    await users[0].sendWsPromise(LOAD_IMAGE.TEST, message);
    expect(fs.existsSync(newImagePath)).toBe(true);

    //remove file
    fs.unlink(newImagePath, (err) => {
      if (err) {
        throw err;
      }
      expect(fs.existsSync(newImagePath)).toBe(false);
    });
  });
});
