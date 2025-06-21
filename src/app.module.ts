import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { GlobalModule } from './global.module';

@Module({
  imports: [GlobalModule, UserModule],
})
export class AppModule {}
