import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'node:path';
import hbs from 'hbs';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

const setupHbs = (app: NestExpressApplication) => {
  hbs.registerPartials(path.resolve('views/partials'));
  hbs.registerHelper('json', (data) => JSON.stringify(data));

  app.useStaticAssets(path.resolve('public'));
  app.setBaseViewsDir(path.resolve('views'));
  app.setViewEngine('hbs');
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());

  setupHbs(app);

  await app.listen(process.env.PORT ?? 8080);
}

void bootstrap();
