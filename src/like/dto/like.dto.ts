import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class Like {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;
}
