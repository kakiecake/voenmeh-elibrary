import { Global, Module } from '@nestjs/common';
import { ConfigSymbol, DbSymbol } from './global.constants';
import knex from 'knex';
import { AppConfig, loadConfig } from './config';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

@Global()
@Module({
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: ConfigSymbol, useFactory: loadConfig },
    {
      provide: DbSymbol,
      useFactory: (config: AppConfig) => {
        return knex({
          client: 'postgres',
          connection: config.db,
        });
      },
      inject: [ConfigSymbol],
    },
  ],
  exports: [DbSymbol, ConfigSymbol],
})
export class GlobalModule {}
