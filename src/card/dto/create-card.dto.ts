import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCard {
  @IsUUID()
  @IsNotEmpty()
  style_tag: string;
}
