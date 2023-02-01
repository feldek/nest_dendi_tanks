import { Injectable } from '@nestjs/common';
import { IWsData, ModifyWebSocket, ACTIONS } from 'src/interfaces/ws';
import { writeFile } from 'fs';

export interface IWsLoadFileActions {
  [ACTIONS.LOAD_IMAGE_TEST]: IWsData<{ buffer: Buffer; extension: string; name: string }>;
}

// needed to inform all node instances about event, because he accumulate info about all games status
@Injectable()
export class WsLoadFileActions {
  [ACTIONS.LOAD_IMAGE_TEST](
    client: ModifyWebSocket,
    { payload: { buffer, extension, name }, uuid }: IWsLoadFileActions[ACTIONS.LOAD_IMAGE_TEST],
  ) {
    writeFile(`test/e2e/${name}.${extension}`, buffer, (err) => {
      if (err) {
        throw err;
      }
    });

    client.send(
      JSON.stringify({
        event: ACTIONS.LOAD_IMAGE_TEST,
        data: { uuid, message: 'Content loaded' },
      }),
    );
  }
}
