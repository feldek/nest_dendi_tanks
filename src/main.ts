import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';

(async () => {
  const PORT = process.env.PORT || 8000;
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: '*' });
  app.useWebSocketAdapter(new WsAdapter(app));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Swagger API')
    .addSecurity('ApiKeyAuth', {
      type: 'apiKey',
      in: 'header',
      name: 'access_token',
    })
    .addSecurityRequirements('ApiKeyAuth')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/v1/api-docs', app, document);

  await app.listen(PORT, () => console.log(`Server started on port = ${PORT}`));
})();
