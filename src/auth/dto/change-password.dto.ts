import { IsNotEmpty, Matches } from 'class-validator';

export class PasswordInfo {
  // 영어 대소문자 + 특수기호 9자리 이상˝
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
}
