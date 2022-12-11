import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import { ACTIONS, ActionTypes, IWsData, ModifyWebSocket } from 'src/interfaces/ws';
import { Server } from 'ws';
import { AuthService } from 'src/controllers/auth/auth.service';
@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(protected authService: AuthService) {}

  @WebSocketServer()
  server: Server<ModifyWebSocket>;
  userIds: number[] = [];
  gameIds: number[] = [];

  protected logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
  protected sendMessage<T>(event: ActionTypes, message: IWsData<T>) {
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
      user.send(JSON.stringify(this.generateResponse<T>(event, message)));
    });
  }

  protected generateResponse<T>(
    event: ActionTypes,
    data: IWsData<T>,
  ): { event: ActionTypes; data: IWsData<T> } {
    return { event, data };
  }

  protected getWsConnectionBy(userId: number) {
    const listWsClients = Array.from(this.server.clients);
    return listWsClients.find((client) => client.userId === userId);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: ModifyWebSocket) {
    this.userIds = this.userIds.filter((userId) => userId !== client.userId);
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  // handleConnection(@ConnectedSocket() client: ModifyWebSocket, ...args: any[]) {
  async handleConnection(client: ModifyWebSocket, ...args: any[]) {
    // const clientId = +args[0].headers.userid;
    // client.userId = clientId;
    //TODO: get role from db
    // client.groups = ['group_test'];
    // client.userRoles = [ROLES.ADMIN];

    this.logger.log(`New client connected`);

    // const message = JSON.stringify(
    //   this.generateResponse(ACTIONS.CONNECTION, {
    //     payload: { message: `Hello user ${clientId}` },
    //     uuid: uuidv4(),
    //   }),
    // );
    // client.send(message);
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
