import { Global, Module } from '@nestjs/common';
import { DbSymbol } from './global.constants';
import knex from 'knex';

@Global()
@Module({
  providers: [
    {
      provide: DbSymbol,
      useFactory: () => {
        return knex({
          client: 'postgres',
          connection: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT!),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
          },
        });
      },
    },
  ],
  exports: [DbSymbol],
})
export class GlobalModule {}
