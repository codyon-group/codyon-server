import { IsNotEmpty, IsUUID } from 'class-validator';

export class DelFollower {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
