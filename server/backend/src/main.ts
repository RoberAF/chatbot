// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  // Deshabilita el bodyParser por defecto de Nest
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: 'http://localhost:3001',    // o usa un env: process.env.FRONTEND_URL
    credentials: true,                  // si manejas cookies o credenciales
  });

  // Usa el parser JSON de Express, pero guarda el buffer en rawBody
  app.use(bodyParser.json({
    verify: (req: any, res, buf) => {
      // Si la ruta es tu webhook, guarda el rawBody
      if (req.originalUrl.startsWith('/api/subscription/webhook')) {
        req.rawBody = buf;
      }
    }
  }));

  // También urlencoded para formularios
  app.use(bodyParser.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades no decoradas
    forbidNonWhitelisted: true, // Arroja error si hay propiedades adicionales
    transform: true, // Transforma automáticamente los datos a tipos TS
  }));

  // Prefijo global
  app.setGlobalPrefix('api');

  // Swagger con bearer auth
  const config = new DocumentBuilder()
    .setTitle('Chatbot IA API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`🚀 Server running on http://localhost:3000/api`);
  console.log(`📖 Swagger UI on http://localhost:3000/api/docs`);
}

bootstrap();
