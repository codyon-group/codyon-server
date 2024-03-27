import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

class CardPagination {
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
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

  @IsUUID()
  @IsOptional()
  style?: string;
}
