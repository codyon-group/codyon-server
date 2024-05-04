import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, Validate } from 'class-validator';
import { validatePaginationLimit } from '../../common/validator';

export class CardPagination {
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @Validate(validatePaginationLimit)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  limit? = 100;
}
