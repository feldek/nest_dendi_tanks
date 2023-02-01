import { Module } from '@nestjs/common';
import { EmitServer } from './emitter';
import { HandleServer } from './handler';

@Module({
  providers: [EmitServer, HandleServer],
  imports: [],
  exports: [EmitServer, HandleServer],
})
export class ServerActionsModule {}
