import { Module } from '@nestjs/common';
import { GameSessionsClass } from './game-sessions.class';

@Module({
  providers: [GameSessionsClass],
  exports: [GameSessionsClass],
})
export class GameSessionsModule {}
