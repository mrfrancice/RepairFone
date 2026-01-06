import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for base64 images
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || ['http://localhost:4200'];
  app.enableCors({
    origin: allowedOrigins,
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
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🔧 FastRepair API Server                               ║
  ║                                                           ║
  ║   Server running on: http://localhost:${port}               ║
  ║   API Docs: http://localhost:${port}/api/docs               ║
  ║   Environment: ${configService.get('nodeEnv')}                          ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
