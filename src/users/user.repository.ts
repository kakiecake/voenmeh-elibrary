import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { User, UserRole } from './types';
import { DbSymbol } from '../global.constants';

@Injectable()
export class UserRepository {
  constructor(@Inject(DbSymbol) private readonly db: Knex) {}

  async authorizeUser(
    email: string,
    password: string,
  ): Promise<Pick<User, 'id' | 'email' | 'role'> | null> {
    const [user] = await this.db('users')
      .select<[Pick<User, 'id' | 'email' | 'role'>]>('id', 'email', 'role')
      .where('email', email)
      .andWhere(
        'password_hash',
        this.db.raw('crypt(?, password_hash)', password),
      );
    return user ?? null;
  }

  async createUser(
    email: string,
    password: string,
    role: UserRole,
  ): Promise<Pick<User, 'id' | 'createdAt'> | null> {
    const [user] = await this.db('users')
      .insert({
        email,
        password_hash: this.db.raw("crypt(?, gen_salt('bf', 8))", password),
        role,
      })
      .returning<[Pick<User, 'id' | 'createdAt'>]>([
        'id',
        'created_at AS "createdAt"',
      ]);
    return user ?? null;
  }
}
