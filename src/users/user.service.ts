import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './user.repository';
import { User, USER_ROLES } from './types';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string } | null> {
    const user = await this.userRepository.authorizeUser(email, password);
    if (!user) return null;
    const accessToken = await this.jwtService.signAsync(user);
    return { accessToken };
  }

  async register(email: string, password: string): Promise<User | null> {
    const createdUser = await this.userRepository.createUser(
      email,
      password,
      USER_ROLES.Reader,
    );
    if (!createdUser) return null;
    return { ...createdUser, email, role: USER_ROLES.Reader };
  }
}
