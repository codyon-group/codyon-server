import { IsNotEmpty, IsUUID } from 'class-validator';

export class Bolck {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
