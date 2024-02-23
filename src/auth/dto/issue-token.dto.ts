import { IsNotEmpty, IsString } from 'class-validator';

export class IssueToken {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
