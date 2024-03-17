import { IsUUID, IsNotEmpty } from 'class-validator';

export class UnFollow {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
