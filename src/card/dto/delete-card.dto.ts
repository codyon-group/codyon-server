import { IsNotEmpty, IsUUID } from 'class-validator';

export class DeleteCard {
  @IsUUID()
  @IsNotEmpty()
  card_id: string;
}
