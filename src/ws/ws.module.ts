import { forwardRef, Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/controllers/auth/auth.module';
import { WsController } from './ws.controller';
// import { WsIoGateway } from './io.gateway';
// import { WsGateway } from './ws.gateway';

@Module({
  providers: [WsController],
  exports: [WsController],
  imports: [forwardRef(() => AuthModule)],
})
export class WSModule {}
