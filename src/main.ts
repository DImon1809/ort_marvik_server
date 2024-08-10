import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as http from 'http';
import * as express from 'express';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(
      '../../etc/letsencrypt/live/ortmarvik.ru/privkey.pem',
      'utf8',
    ),
    cert: fs.readFileSync(
      '../../etc/letsencrypt/live/ortmarvik.ru/cert.pem',
      'utf8',
    ),
    ca: fs.readFileSync(
      '../../etc/letsencrypt/live/ortmarvik.ru/chain.pem',
      'utf8',
    ),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  await app.listen(443);

  const httpApp = express();
  httpApp.get('*', (req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
  });

  http.createServer(httpApp).listen(80, () => {
    console.log('HTTP Server running on port 80 and redirecting to HTTPS');
  });
}

bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import * as cookieParser from 'cookie-parser';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.useGlobalPipes(new ValidationPipe());
//   app.use(cookieParser());

//   await app.listen(4000);
// }

// bootstrap();
