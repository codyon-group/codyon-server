import { Body, Controller, Post } from '@nestjs/common';
import { CheckEmail } from './dto/check-email.dto';
import { CheckNickName } from './dto/check-nickname.dto';
import { SignUp } from './dto/sign-up.dto';
import { UserService } from './user.service';
@Controller('api/sign-up')
export class UserController {
  constructor(private userService: UserService) {}

  // email 중복 확인
  @Post('check/email')
  async checkDuplicateEmail(@Body() data: CheckEmail): Promise<{ usable: boolean }> {
    const result = await this.userService.checkDuplicateEmail(data.email);

    return { usable: !result };
  }

  // 닉네임 중복 확인
  @Post('check/nick-name')
  async checkDuplicateNickName(@Body() data: CheckNickName): Promise<{ usable: boolean }> {
    const result = await this.userService.checkDuplicateNickName(data.nick_name);

    return { usable: !result };
  }

  // 회원 가입
  @Post('')
  async signUp(@Body() data: SignUp): Promise<{ success: boolean }> {
    const result = await this.userService.signUp(data);

    return { success: result };
  }
}
