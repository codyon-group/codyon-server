import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendMail {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
