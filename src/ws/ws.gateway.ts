import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import { IWsMessage, ModifyWebSocket } from 'src/interfaces/ws';
import { Server } from 'ws';

@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ModifyWebSocket>;

  private logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
  private sendMessage(message: IWsMessage) {
    const { action, ...otherParams } = message;

    //find consumer in accordance with "to" obj {userId or groups}
    const listWsClients = Array.from(this.server.clients);
    const userTarget = Object.entries(message.to)
      .map(([targetName, targetValue]) =>
        listWsClients.filter((user) => {
          const userTargetField = Array.isArray(user[targetName])
            ? user[targetName]
            : [user[targetName]];
          return intersection(userTargetField, targetValue).length;
        }),
      )
      .flat();

    userTarget.forEach((user) => {
      user.send(JSON.stringify({ event: action, data: otherParams }));
    });
  }

  @SubscribeMessage('message')
  handleMessage(_client: ModifyWebSocket, message: IWsMessage) {
    this.sendMessage(message);
  }

  @SubscribeMessage('events')
  onEvent(_client: ModifyWebSocket, message: IWsMessage) {
    this.sendMessage(message);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: ModifyWebSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  handleConnection(client: ModifyWebSocket, ...args: any[]) {
    const clientId = +args[0].headers.userid;
    client.userId = clientId;
    client.groups = ['group_test'];

    client.send(
      JSON.stringify({
        event: 'message',
        data: {
          payload: { msg: `Hello user ${clientId}` },
          to: clientId,
          action: 'connection',
          uuid: 'uuid',
        },
      }),
    );

    this.logger.log(`Client connected: ${clientId}`);
  }
}
