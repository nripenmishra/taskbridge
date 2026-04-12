import { existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const cwd = process.cwd();
for (const envPath of [
  join(cwd, '.env'),
  join(cwd, '..', '.env'),
  join(cwd, '..', '..', '.env'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({ origin: true });
  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
