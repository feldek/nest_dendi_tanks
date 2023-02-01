import { Module } from '@nestjs/common';
import { WsLoadFileActions } from './handler';

@Module({
  providers: [WsLoadFileActions],
  exports: [WsLoadFileActions],
})
export class LoadActionsModule {}
