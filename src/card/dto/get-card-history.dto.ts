import { IsNumberString, IsOptional, IsUUID } from 'class-validator';

export class CardPagination {
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}
