import { WsGamesState } from '../gateway/ws.games-state';
import { Module } from '@nestjs/common';
import { WsController } from './controller';
import { GameSessionsModule } from 'src/game/game-sessions.module';
import { ClientActionsModule } from '../actions/client/client-actions.module';
import { GameActionsModule } from '../actions/game/game-actions.module';
import { ServerActionsModule } from '../actions/server/game-actions.module';
import { LoadActionsModule } from '../actions/load-file-test/load-actions.module';

@Module({
  providers: [WsController, WsGamesState],
  imports: [
    GameSessionsModule,
    ClientActionsModule,
    GameActionsModule,
    ServerActionsModule,
    LoadActionsModule,
  ],
})
export class WSModule {}
