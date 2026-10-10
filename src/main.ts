import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

function protectSwagger(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.SWAGGER_KEY;
  const queryKey = req.query.key;
  const cookieKey = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('swagger_key='))
    ?.slice('swagger_key='.length);
  const requestKey =
    typeof queryKey === 'string'
      ? queryKey
      : cookieKey === encodeURIComponent(configuredKey ?? '')
        ? configuredKey
        : undefined;

  if (!configuredKey || requestKey !== configuredKey) {
    res.status(401).json({ message: 'Swagger access requires a valid key' });
    return;
  }

  if (typeof queryKey === 'string') {
    res.setHeader(
      'Set-Cookie',
      `swagger_key=${encodeURIComponent(configuredKey)}; HttpOnly; SameSite=Strict; Path=/api/docs`,
    );
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  app.use('/api/docs', protectSwagger);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistem Informasi Koperasi API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
