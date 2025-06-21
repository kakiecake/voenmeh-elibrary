import { IsEmail, IsString, Length } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @Length(8, 32)
  @IsString()
  password: string;
}
