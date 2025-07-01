import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../config';
import { ConfigSymbol } from '../global.constants';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: AppConfig) => ({ secret: config.jwtSecret }),
      inject: [ConfigSymbol],
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class UserModule {}
