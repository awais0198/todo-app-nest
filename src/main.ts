import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Todo API')
    .setDescription(
      'A comprehensive Todo management API with CRUD operations, filtering, and pagination',
    )
    .setVersion('1.0')
    .addTag('tasks')
    .addServer(
      process.env.NODE_ENV === 'production'
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RENDER_EXTERNAL_URL || 'your-app.railway.app'}`
        : 'http://localhost:3000',
      process.env.NODE_ENV === 'production'
        ? 'Production server'
        : 'Local server',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      message: 'Todo API is running',
      version: '1.0.0',
      endpoints: {
        swagger: '/api',
        tasks: '/tasks',
        health: '/tasks/stats',
      },
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
