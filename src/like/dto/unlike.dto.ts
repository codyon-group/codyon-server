import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UnLike {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;
}
