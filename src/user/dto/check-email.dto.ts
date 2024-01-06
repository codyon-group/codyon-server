import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckEmail {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
