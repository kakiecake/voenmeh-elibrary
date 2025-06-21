import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET_SYMBOL } from './constants';

@Module({
  imports: [
    JwtModule.register({
      secret: 'secret123',
    }),
  ],
  controllers: [UserController],
  providers: [
    { provide: JWT_SECRET_SYMBOL, useValue: 'secret123' },
    UserService,
    UserRepository,
  ],
})
export class UserModule {}
