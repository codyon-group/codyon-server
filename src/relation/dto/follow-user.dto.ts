import { IsUUID, IsNotEmpty } from 'class-validator';

export class Follow {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
