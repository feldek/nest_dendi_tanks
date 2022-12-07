import { Module } from '@nestjs/common';
import { WsController } from './ws.controller';
// import { WsIoGateway } from './io.gateway';
// import { WsGateway } from './ws.gateway';

@Module({
  providers: [WsController],
})
export class WSModule {}
