import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import { ACTIONS, IWsMessage, ModifyWebSocket } from 'src/interfaces/ws';
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
  private sendMessage<T>(message: IWsMessage<T>) {
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

  // handleMessage(_client: ModifyWebSocket, message: IWsMessage) {
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: IWsMessage<{ test: string }>) {
    this.sendMessage(message);
  }

  @SubscribeMessage(ACTIONS.SEND_MSG)
  onEvent(@MessageBody() message: IWsMessage<{ test: string }>) {
    this.sendMessage(message);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: ModifyWebSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  // handleConnection(@ConnectedSocket() client: ModifyWebSocket, ...args: any[]) {
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
