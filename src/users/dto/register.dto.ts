import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @Length(8, 32)
  @IsString()
  password: string;
}
