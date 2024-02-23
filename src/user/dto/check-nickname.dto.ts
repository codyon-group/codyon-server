import { IsNotEmpty, Matches } from 'class-validator';

export class CheckNickName {
  @Matches(RegExp(/^(?=.*[a-zA-Z]).{3,}$/gi), {
    message: '닉네임 형식이 잘못 되었습니다. 영문으로 3글자 이상 기입해 주세요.',
  })
  @IsNotEmpty()
  nick_name: string;
}
