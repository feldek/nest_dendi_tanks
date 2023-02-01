import { WsGamesState } from '../gateway/ws.games-state';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/controllers/auth/auth.module';
import { WsController } from './controller';
import { GameActionsModule } from '../actions/actions.module';
import { GameSessionsModule } from 'src/game/game-sessions.module';

@Module({
  providers: [WsController, WsGamesState],
  imports: [forwardRef(() => AuthModule), GameActionsModule, GameSessionsModule],
})
export class WSModule {}
