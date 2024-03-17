import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

class Pagination {
  @IsNumberString()
  @IsOptional()
  cursor?: string;

  @IsNumberString()
  @IsOptional()
  limit?: string;
}

export class RelationByStatus extends Pagination {
  @IsString()
  @IsNotEmpty()
  status: string;
}
