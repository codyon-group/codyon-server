import { Body, Controller, Get, Post, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignIn } from './dto/login.dto';
import { AccessTokenInfo, SignUpInfo, UserTokenInfo } from './type';
import { IssueToken } from './dto/issue-token.dto';

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
}
