import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { GlobalModule } from './global.module';
import { BookModule } from './books/book.module';

@Module({
  imports: [GlobalModule, UserModule, BookModule],
})
export class AppModule {}
