import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    })
   );
  // await app.listen(3000);
  const PORT = process.env.PORT ?? 3000;
  
  console.log(`aplicacion corriendo en puerto: ${PORT}`)
  await app.listen(PORT);
}
bootstrap();
