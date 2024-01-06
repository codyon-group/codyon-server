import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SignIn {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  password: string;
}
