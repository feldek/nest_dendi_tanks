import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import { ACTIONS, IWsMessage, ModifyWebSocket } from 'src/interfaces/ws';
import { Server } from 'ws';
import { ROLES } from 'src/constants';

@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ModifyWebSocket>;

  protected logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
  protected sendMessage<T>(message: IWsMessage<T>) {
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
      user.send(JSON.stringify(this.generateResponse<T>(message)));
    });
  }

  protected generateResponse<T>(message: IWsMessage<T>): {
    event: IWsMessage<T>['event'];
    data: Omit<IWsMessage<T>, 'event'>;
  } {
    const { event, ...otherParams } = message;
    return { event, data: otherParams };
  }

  protected getWsConnectionBy(userId: number) {
    const listWsClients = Array.from(this.server.clients);
    return listWsClients.find((client) => client.userId === userId);
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
    //TODO: get role from db
    client.groups = ['group_test'];
    client.userRoles = [ROLES.ADMIN];

    this.logger.log(`Client connected: ${clientId}`);

    const message = JSON.stringify(
      this.generateResponse({
        event: ACTIONS.CONNECTION,
        payload: { message: `Hello user ${clientId}` },
        uuid: uuidv4(),
      }),
    );
    client.send(message);
  }

  static sendError<T = {}>(
    client: ModifyWebSocket,
    data: { message: string; status?: number } & T,
  ) {
    client.send(
      JSON.stringify({
        event: ACTIONS.ERROR,
        data: { message: data.message, status: data.status || 400 },
      }),
    );
  }
}
