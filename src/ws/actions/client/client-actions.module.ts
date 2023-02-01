import { Module } from '@nestjs/common';
import { EmitClient } from './emitter';
import { HandleClient } from './handler';

@Module({
  providers: [HandleClient, EmitClient],  
  exports: [HandleClient, EmitClient],
})
export class ClientActionsModule {}
