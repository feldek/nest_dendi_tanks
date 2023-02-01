import { Module } from '@nestjs/common';
import { GameSessionsModule } from 'src/game/game-sessions.module';
import { EmitGame } from './emitter';
import { HandleGame } from './handler';

@Module({
  providers: [EmitGame, HandleGame],
  imports: [GameSessionsModule],
  exports: [EmitGame, HandleGame],
})
export class GameActionsModule {}
