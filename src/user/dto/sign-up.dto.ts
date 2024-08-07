import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class SignUp {
  // email 인증 세션 아이디
  @IsUUID()
  @IsNotEmpty()
  session_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // 영어 대소문자 + 특수기호 9자리 이상
  @Matches(RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^*+=-]).{9,}$/gi), {
    message: '비밀번호 형식이 잘못 되었습니다.',
  })
  @IsNotEmpty()
  password: string;

  @Matches(RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^*+=-]).{9,}$/gi), {
    message: '비밀번호 형식이 잘못 되었습니다.',
  })
  @IsNotEmpty()
  confirm_password: string;

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
