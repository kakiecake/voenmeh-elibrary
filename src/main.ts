import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'node:path';
import hbs from 'hbs';
import handlebarsHelpers from 'handlebars-helpers';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

const setupHandlebars = (app: NestExpressApplication) => {
  const helpers = handlebarsHelpers('comparison');
  Object.entries(helpers).forEach(([helperName, helperFunc]) =>
    hbs.registerHelper(helperName, helperFunc),
  );
  hbs.registerHelper('json', (data) => JSON.stringify(data));

  hbs.registerPartials(path.resolve('views/partials'));

  app.useStaticAssets(path.resolve('public'));
  app.setBaseViewsDir(path.resolve('views'));
  app.setViewEngine('hbs');
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.use(cookieParser());

  setupHandlebars(app);

  await app.listen(process.env.PORT ?? 8080);
}

void bootstrap();
