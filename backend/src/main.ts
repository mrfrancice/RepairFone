import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Body size limits - 10MB max (use multipart for larger files)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  const configService = app.get(ConfigService);

  // SEC-003: Security Headers - Helmet with CSP configuration
  const isDev = configService.get<string>('nodeEnv') === 'development';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // In production, remove unsafe-inline and unsafe-eval
          scriptSrc: isDev
            ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
            : ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https://api.mapbox.com', 'wss:', 'ws:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isDev ? [] : null, // Only in production
        },
      },
      crossOriginEmbedderPolicy: false, // Needed for external images
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // CORS
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || ['http://localhost:4200'];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow any localhost port for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }
      // Check against configured allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global Prefix
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FastRepair API')
    .setDescription('API pour la plateforme de réparation FastRepair - Côte d\'Ivoire')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Endpoints d\'authentification')
    .addTag('Users', 'Gestion des utilisateurs')
    .addTag('Repairers', 'Gestion des réparateurs')
    .addTag('Requests', 'Demandes de réparation')
    .addTag('Reviews', 'Avis et évaluations')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = configService.get<number>('port') || 3000;
  const logger = new Logger('Bootstrap');
  await app.listen(port);

  logger.log(`
  ============================================================
  FastRepair API Server
  ------------------------------------------------------------
  Server running on: http://localhost:${port}
  API Docs: http://localhost:${port}/api/docs
  Environment: ${configService.get('nodeEnv')}
  ============================================================
  `);
}

bootstrap();
