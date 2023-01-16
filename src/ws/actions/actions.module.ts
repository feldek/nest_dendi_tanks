import { ServerActions } from './server';
import { Module } from '@nestjs/common';
import { ClientActions } from './client';
import { GameActions } from './game';
import { WsLoadFileActions } from './load-file';
import { GameSessionsModule } from 'src/game/game-sessions.module';

@Module({
  providers: [GameActions, ClientActions, WsLoadFileActions, ServerActions],
  imports: [GameSessionsModule],
  exports: [GameActions, ClientActions, ServerActions, WsLoadFileActions],
})
export class GameActionsModule {}
