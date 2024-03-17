import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

// todo util or common으로 빼기
class Pagination {
  @IsString()
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
