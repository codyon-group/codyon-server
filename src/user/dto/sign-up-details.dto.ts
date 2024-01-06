import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class SingUpDetails {
  // oauth 인증 세션 아이디
  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @Matches(RegExp(/^(?=.*[a-zA-Z]).{3,}$/gi), {
    message: '닉네임 형식이 잘못 되었습니다. 영문으로 3글자 이상 기입해 주세요.',
  })
  @IsNotEmpty()
  nick_name: string;

  @IsString()
  @IsOptional()
  sns_id: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  height: string;

  @IsString()
  @IsNotEmpty()
  weight: string;

  @IsString()
  @IsNotEmpty()
  feet_size: string;

  @IsNotEmpty()
  styles: string[];
}
