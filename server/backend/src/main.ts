import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: [
      'http://localhost:3001',              
      'https://app.roberx.dev',            
      'https://chatbot-puce-six.vercel.app',    
    ],
    credentials: true,
  });

  app.use(bodyParser.json({
    verify: (req: any, res, buf) => {
      if (req.originalUrl.startsWith('/api/subscription/webhook')) {
        req.rawBody = buf;
      }
    }
  }));

  app.use(bodyParser.urlencoded({ extended: true }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, 
    forbidNonWhitelisted: false,
    transform: true, 
  }));

  app.setGlobalPrefix('api');

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
