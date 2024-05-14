import { IsNotEmpty, IsUUID } from 'class-validator';

export class UnBolck {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
