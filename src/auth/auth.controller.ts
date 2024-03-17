import { Body, Controller, Get, Post, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignIn } from './dto/login.dto';
import { AccessTokenInfo, SignUpInfo, UserReq, UserTokenInfo } from './type';
import { IssueToken } from './dto/issue-token.dto';
import { AuthGuard } from './auth.guard';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { PasswordInfo } from './dto/change-password.dto';

@Controller('api')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 일반 로그인
  @Post('sign-in')
  async login(@Body() data: SignIn): Promise<{ data: UserTokenInfo }> {
    const tokenInfo = await this.authService.signIn(data.email, data.password);

    return { data: tokenInfo };
  }

  // 새 token 발급 요청, authgaurd 동작하면 안됨
  @Post('issue/token')
  async issueToken(@Body() data: IssueToken): Promise<{ data: UserTokenInfo | AccessTokenInfo }> {
    const tokenInfo = await this.authService.createTokenByRefreshToken(data.refresh_token);

    return { data: tokenInfo };
  }

  // kakao oauth login 요청
  @Get('/oauth/kakao/login')
  @Redirect('')
  async reqOauthKaKaoLogin(): Promise<{ url: string }> {
    const url = await this.authService.reqOauthKaKaoLogin();

    return {
      url: decodeURIComponent(url),
    };
  }

  // kakao 인증 후 회원 가입 또는 로그인 진행
  @Get('oauth/kakao')
  async oauthKaKaoLogin(
    @Query('code') code: string,
  ): Promise<{ data: SignUpInfo | UserTokenInfo }> {
    const result = await this.authService.oauthKaKaoLogin(code);

    return { data: result };
  }

  @UseGuards(AuthGuard)
  @Post('/change/password')
  async changePassword(
    @Req() req: UserReq,
    @Body() passwordInfo: PasswordInfo,
  ): Promise<{ success: boolean }> {
    const { password, confirm_password: confirmPassword } = passwordInfo;

    if (password !== confirmPassword) {
      throw new ErrorHandler(
        ErrorCode.INVALID_ARGUMENT,
        'password',
        '비밀번호가 일치하지 않습니다.',
      );
    }

    // 비밀번호 암호화
    const hashedPassword = await this.authService.hashPassword(password);

    await this.authService.changePassword(req.user.id, hashedPassword);

    // 비밀번호 변경 시 재로그인 해야 함
    await this.authService.delRefreshToken(req.user.id);

    return { success: true };
  }
}
