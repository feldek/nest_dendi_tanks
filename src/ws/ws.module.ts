import { WsGamesState } from './gateway/ws.games-state';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/controllers/auth/auth.module';
import { WsController } from './ws.controller';
// import { WsIoGateway } from './io.gateway';
// import { WsGateway } from './ws.gateway';

@Module({
  providers: [WsController, WsGamesState],
  exports: [WsController],
  imports: [forwardRef(() => AuthModule)],
})
export class WSModule {}
