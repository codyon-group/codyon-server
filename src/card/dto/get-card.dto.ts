import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetCard {
  @IsUUID()
  @IsNotEmpty()
  card_id: string;
}
