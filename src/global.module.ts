import { Global, Module } from '@nestjs/common';
import { ConfigSymbol, DbSymbol } from './global.constants';
import knex from 'knex';
import { AppConfig, loadConfig } from './config';

@Global()
@Module({
  providers: [
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
