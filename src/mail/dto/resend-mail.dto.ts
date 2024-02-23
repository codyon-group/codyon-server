import { IsNotEmpty, IsUUID } from 'class-validator';

export class ResendMail {
  @IsUUID()
  @IsNotEmpty()
  session_id: string;
}
