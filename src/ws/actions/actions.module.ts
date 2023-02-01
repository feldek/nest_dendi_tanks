import { HandleServer } from './server/handler';
import { Module } from '@nestjs/common';
import { HandleGame } from './game/handler';
import { WsLoadFileActions } from './load-file-test/handler';
import { GameSessionsModule } from 'src/game/game-sessions.module';
import { EmitClient } from './client/emitter';
import { EmitServer } from './server/emitter';
import { HandleClient } from './client/handler';
import { EmitGame } from './game/emitter';

@Module({
  providers: [
    HandleGame,
    HandleClient,
    WsLoadFileActions,
    HandleServer,
    EmitClient,
    EmitServer,
    EmitGame,
  ],
  imports: [GameSessionsModule],
  exports: [
    HandleGame,
    HandleClient,
    HandleServer,
    WsLoadFileActions,
    EmitClient,
    EmitServer,
    EmitGame,
  ],
})
export class GameActionsModule {}
