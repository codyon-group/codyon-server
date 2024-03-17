import { IsArray, IsEnum, IsNumberString, IsOptional, IsString, Matches } from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

// 변경할 항목만 받으면 됨
export class ChangeProfile {
  @Matches(RegExp(/^(?=.*[a-zA-Z]).{3,}$/gi), {
    message: '닉네임 형식이 잘못 되었습니다. 영문으로 3글자 이상 기입해 주세요.',
  })
  @IsOptional()
  nick_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(Gender)
  gender?: string;

  @IsNumberString()
  @IsOptional()
  height?: string;

  @IsNumberString()
  @IsOptional()
  weight?: string;

  @IsNumberString()
  @IsOptional()
  feet_size?: string;

  @IsString()
  @IsOptional()
  sns_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favorite_style?: string[];

  @IsString()
  @IsOptional()
  mbti?: string;
}
