import { LOAD_IMAGE, IWsData, ModifyWebSocket } from 'src/interfaces/ws';
import { writeFile } from 'fs';

export interface IWsLoadFileActions {
  [LOAD_IMAGE.TEST]: IWsData<{ buffer: Buffer; extension: string; name: string }>;
}

// needed to inform all node instances about event, because he accumulate info about all games status
export const wsLoadFileActions = {
  [LOAD_IMAGE.TEST]: (
    client: ModifyWebSocket,
    { payload: { buffer, extension, name }, uuid }: IWsLoadFileActions[LOAD_IMAGE.TEST],
  ) => {
    writeFile(`test/e2e/${name}.${extension}`, buffer, (err) => {
      if (err) {
        throw err;
      }
    });

    client.send(
      JSON.stringify({ event: LOAD_IMAGE.TEST, data: { uuid, message: 'Content loaded' } }),
    );
  },
};
