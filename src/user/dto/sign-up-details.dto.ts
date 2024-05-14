import {
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

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
  @IsEnum(Gender)
  gender: string;

  @IsNumberString()
  @IsNotEmpty()
  height: string;

  @IsNumberString()
  @IsNotEmpty()
  weight: string;

  @IsNumberString()
  @IsNotEmpty()
  feet_size: string;

  @IsNotEmpty()
  styles: string[];
}
