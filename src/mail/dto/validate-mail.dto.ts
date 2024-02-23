import { IsNotEmpty, IsNumberString, IsUUID, Length } from 'class-validator';

export class validateMail {
  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @IsNumberString({ no_symbols: true }, { message: '인증 코드 형식이 잘못 되었습니다.' })
  @Length(4, 4, { message: '인증 코드 형식이 잘못 되었습니다.' })
  @IsNotEmpty()
  code: string;
}
