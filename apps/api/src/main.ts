import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // Cookie Parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // CORS
  const configuredCors = process.env.CORS_ORIGINS;
  const corsOrigins = configuredCors
    ? configuredCors.split(',').map((o) => o.trim())
    : true;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // URL Versioning: /v1/...
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // Global Standard Response Envelope, Logging & Global Exception Filter
  app.useGlobalInterceptors(
    new ResponseEnvelopeInterceptor(),
    new LoggingInterceptor()
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce Platform API')
      .setDescription('Modular monolith REST API for Storefront and Admin back-office')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT || process.env.API_PORT || 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API server is running on: http://localhost:${port}/v1`);
  console.log(`📚 Swagger documentation at: http://localhost:${port}/docs`);
  console.log(`🩺 Healthcheck endpoint: http://localhost:${port}/v1/health`);
  console.log(`📊 Detailed Health telemetry: http://localhost:${port}/v1/health/detailed`);
}

bootstrap();
