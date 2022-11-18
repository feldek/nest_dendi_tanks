import { Module } from '@nestjs/common';
// import { WsIoGateway } from './io.gateway';
import { WsGateway } from './ws.gateway';

@Module({
  providers: [WsGateway],
})
export class WSModule {}
