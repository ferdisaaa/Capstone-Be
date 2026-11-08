import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Wajib aktifkan CORS agar Flutter HP & Browser diizinkan masuk
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set global prefix untuk endpoint API
  app.setGlobalPrefix('api');

  // 2. Wajib sertakan '0.0.0.0' agar mendengarkan antarmuka IP Kali Linux / Docker
  await app.listen(3000, '0.0.0.0');
}
bootstrap();