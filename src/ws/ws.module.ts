import { WsGamesState } from './gateway/ws.games-state';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/controllers/auth/auth.module';
import { WsController } from './ws.controller';
import { ClientActions } from './actions/client';
import { GameActions } from './actions/game';
import { ServerActions } from './actions/server';
import { WsLoadFileActions } from './actions/load-file';

@Module({
  providers: [
    WsController,
    WsGamesState,
    ClientActions,
    GameActions,
    ServerActions,
    WsLoadFileActions,
  ],
  exports: [WsController],
  imports: [forwardRef(() => AuthModule)],
})
export class WSModule {}
