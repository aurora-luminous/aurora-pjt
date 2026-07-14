import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`SFU HTTP Server is running on: http://localhost:${port}`);
}
bootstrap();
