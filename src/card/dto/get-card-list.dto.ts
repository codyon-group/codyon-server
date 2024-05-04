import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import { Gender, validatePaginationLimit } from '../../common/validator';

class CardPagination {
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @Validate(validatePaginationLimit)
  @Transform(({ value }) => Number(value))
  @IsOptional()
  limit? = 100;
}

export class CardList extends CardPagination {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsEnum(Gender)
  @IsOptional()
  gender?: string;

  @IsArray()
  @IsNumberString({}, { each: true })
  @ArrayMaxSize(2)
  @IsOptional()
  height?: [string, string];

  @IsArray()
  @IsNumberString({}, { each: true })
  @ArrayMaxSize(2)
  @IsOptional()
  weight?: [string, string];

  @IsArray()
  @IsNumberString({}, { each: true })
  @ArrayMaxSize(2)
  @IsOptional()
  feet_size?: [string, string];

  @IsString()
  @IsOptional()
  mbti?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  style?: string[];

  @IsString()
  @IsEnum(['view', 'like', 'new']) // 조회순, 인기순, 최신순 (default)
  @IsOptional()
  sort?: string;
}
