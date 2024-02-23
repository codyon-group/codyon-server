import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { verify } from 'argon2';
import axios from 'axios';
import dayjs from 'dayjs';
import { v4 as uuidV4 } from 'uuid';
import { CacheService } from '../cache/cache.service';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode, ErrorDetailCode } from '../exception/error.type';
import {
  AccessTokenInfo,
  OauthUserInfo,
  RefreshTokenInfo,
  SignUpInfo,
  SignedUserInfo,
  UserInfo,
  UserTokenInfo,
} from './type';

const REFRESH_TOKEN = 'refresh-token:';

@Injectable()
export class AuthService {
  private ACCESSTOKEN_EXPIRE: number;
  private REFRESHTOKEN_EXPIRE: number;
  private ACCESSTOKEN_SECRET: string;
  private REFRESHTOKEN_SECRET: string;
  private CLIENT_ID: string;
  private CLIENT_SECRET: string;
  private REDIRECT_URI: string;

  constructor(
    private configService: ConfigService,
    private dbService: DbService,
    private cacheService: CacheService,
    private jwtService: JwtService,
  ) {
    this.ACCESSTOKEN_EXPIRE = Number(this.configService.get('ACCESSTOKEN_EXPIRE'));
    this.REFRESHTOKEN_EXPIRE = Number(this.configService.get('REFRESHTOKEN_EXPIRE'));
    this.ACCESSTOKEN_SECRET = this.configService.get('ACCESSTOKEN_SECRET');
    this.REFRESHTOKEN_SECRET = this.configService.get('REFRESHTOKEN_SECRET');
    this.CLIENT_ID = this.configService.get('KAKAO_CLIENT_ID');
    this.CLIENT_SECRET = this.configService.get('KAKAO_CLIENT_SECRET');
    this.REDIRECT_URI = this.configService.get('REDIRECT_URL');
  }

  async checkSignedUser(email: string): Promise<UserInfo | undefined> {
    try {
      const userInfo = await this.dbService.user.findUnique({
        select: {
          id: true,
          password: true,
        },
        where: {
          email,
        },
      });

      return userInfo;
    } catch (err) {
      console.error(`checkSignedUser: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkPassword(password: string, hashPassword: string): Promise<boolean> {
    try {
      const isCorrect = await verify(hashPassword, password);

      return isCorrect;
    } catch (err) {
      console.error(`checkPassword: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async signIn(email: string, password: string): Promise<UserTokenInfo> {
    // 해당 email로 가입 여부 조회
    const { id: userId, password: hashPassword } = await this.checkSignedUser(email);

    if (hashPassword == null) {
      throw new ErrorHandler(
        ErrorCode.UNAUTHORIZED,
        {},
        '이메일 또는 패스워드를 다시 한번 확인해주세요',
      );
    }

    // 비밀번호 일치 확인
    const isCorrect = await this.checkPassword(password, hashPassword);

    if (!isCorrect) {
      throw new ErrorHandler(
        ErrorCode.UNAUTHORIZED,
        {},
        '이메일 또는 패스워드를 다시 한번 확인해주세요',
      );
    }

    const tokenInfo = await this.createToken(userId);

    return tokenInfo;
  }

  async createAccessToken(userId: string): Promise<string> {
    try {
      const accessToken = await this.jwtService.signAsync(
        { id: userId },
        {
          secret: this.ACCESSTOKEN_SECRET,
          expiresIn: this.ACCESSTOKEN_EXPIRE + 10, // 10초 여유
        },
      );

      return accessToken;
    } catch (err) {
      console.error(`createAccessToken: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createRefreshToken(userId: string): Promise<string> {
    try {
      const refreshToken = await this.jwtService.signAsync(
        { id: userId },
        {
          secret: this.REFRESHTOKEN_SECRET,
          expiresIn: this.REFRESHTOKEN_EXPIRE + 10, // 10초 여유
        },
      );

      return refreshToken;
    } catch (err) {
      console.error(`createRefreshToken: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createToken(userId: string): Promise<UserTokenInfo> {
    const accessToken = await this.createAccessToken(userId);
    const refreshToken = await this.createRefreshToken(userId);
    const key = REFRESH_TOKEN + userId;

    await this.cacheService.set(key, refreshToken, this.REFRESHTOKEN_EXPIRE + 10); // 10초 여유

    const tokenInfo: UserTokenInfo = {
      token_type: 'Bearer',
      access_token: accessToken,
      access_token_expire_time: dayjs().add(this.ACCESSTOKEN_EXPIRE, 'seconds'),
      refresh_token: refreshToken,
      refresh_token_expires_time: dayjs().add(this.REFRESHTOKEN_EXPIRE, 'seconds'),
    };

    return tokenInfo;
  }

  async verifyRefreshToken(refreshToekn: string): Promise<RefreshTokenInfo> {
    try {
      const verfiedUserInfo = await this.jwtService.verifyAsync(refreshToekn, {
        secret: this.REFRESHTOKEN_SECRET,
      });

      return verfiedUserInfo as RefreshTokenInfo;
    } catch (err) {
      console.error(`verifyRefreshToken: ${err.message}`);

      if (err instanceof TokenExpiredError) {
        throw new ErrorHandler(
          ErrorCode.UNAUTHORIZED,
          { token: ErrorDetailCode.EXPIRED },
          '만료된 토큰입니다. 다시 로그인해주세요.',
        );
      } else if (err instanceof JsonWebTokenError) {
        throw new ErrorHandler(
          ErrorCode.INTERNAL_SERVER_ERROR,
          { token: ErrorDetailCode.INVALID },
          '유효하지 않은 토큰입니다. 다시 로그인해주세요.',
        );
      }
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createTokenByRefreshToken(refreshToken: string): Promise<AccessTokenInfo | UserTokenInfo> {
    // refreshToken 유효성 확인
    const { id: userId, exp } = await this.verifyRefreshToken(refreshToken);
    const key = REFRESH_TOKEN + userId;
    const storedRefreshToken = await this.cacheService.get(key);

    // 서버내 해당 refreshToken 저장 여부 확인
    if (storedRefreshToken == null || storedRefreshToken !== refreshToken) {
      throw new ErrorHandler(
        ErrorCode.UNAUTHORIZED,
        { token: ErrorDetailCode.EXPIRED },
        '만료된 토큰입니다. 다시 로그인해주세요.',
      );
    }

    // refreshToken의 만료 시간이 한 시간 이하인 경우 accessToken & refreshToken 발급
    if (dayjs(exp * 1000).diff(dayjs()) > 60 * 60 * 1000) {
      const accessToken = await this.createAccessToken(userId);
      const result: AccessTokenInfo = {
        token_type: 'Bearer',
        access_token: accessToken,
        access_token_expire_time: dayjs().add(this.ACCESSTOKEN_EXPIRE, 'seconds'),
      };

      return result;
    } else {
      return await this.createToken(userId);
    }
  }

  async reqOauthKaKaoLogin(): Promise<string> {
    const url = new URL(this.configService.get<string>('REQ_KAKAO_OAUTH_URL'));

    url.searchParams.append('client_id', this.CLIENT_ID);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', this.REDIRECT_URI);
    url.searchParams.append('client_secret', this.CLIENT_SECRET);

    return url.toString();
  }

  async kakaoLoginToken(code: string): Promise<any> {
    try {
      const { data } = await axios.post('https://kauth.kakao.com/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: this.CLIENT_ID,
          redirect_uri: this.REDIRECT_URI,
          code: code,
          client_secret: this.CLIENT_SECRET,
        },
      });

      return data;
    } catch (err) {
      console.error(`kakaoLoginToken: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async kakaoGetUserInfo(accessToken: string): Promise<OauthUserInfo> {
    try {
      const { data } = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userInfo: OauthUserInfo = {
        email: data.kakao_account.email,
        name: data.kakao_account.name,
        gender: data.kakao_account.gender,
        nickName: data.kakao_account.profile?.nickname,
        profile_img: data.kakao_account.profile?.profile_image_url,
      };

      return userInfo;
    } catch (err) {
      console.error(`kakaoGetUserInfo: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkSignedUserByProvider(providerId: string): Promise<string | undefined> {
    try {
      const user = await this.dbService.user.findUnique({
        select: {
          id: true,
        },
        where: {
          email: providerId,
        },
      });

      return user?.id;
    } catch (err) {
      throw err;
    }
  }

  async checkPreSignedUser(email: string): Promise<SignedUserInfo | undefined> {
    try {
      const signedUserInfo: SignedUserInfo = await this.dbService.user.findFirst({
        where: {
          email,
        },
        select: {
          id: true,
          provider: true,
        },
      });

      return signedUserInfo;
    } catch (err) {
      console.error(`checkSignedUser: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async setOauthSession(
    sessionId: string,
    email: string,
    provider: string,
    profileImg?: string,
  ): Promise<void> {
    const key = `oauth-sign-up:${sessionId}`;

    await this.cacheService.hMSet(
      key,
      [
        ['email', email],
        ['provider', provider],
        ['profile_img', profileImg],
      ],
      10 * 60,
    );
  }

  async setProvider(id: string, provider: string[]): Promise<void> {
    try {
      await this.dbService.user.update({
        where: {
          id,
        },
        data: {
          provider,
        },
      });
    } catch (err) {
      console.error(`setProvider: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async oauthKaKaoLogin(code: string): Promise<SignUpInfo | UserTokenInfo> {
    // kakao 계정 로그인 완료 후 token 발급
    const token = await this.kakaoLoginToken(code);

    // 로그인 완료 후 받은 토큰으로 사용자 정보 조회
    const userInfo = await this.kakaoGetUserInfo(token.access_token);

    // 신규 회원인지 기존 회원인지 확인
    const signedUserInfo = await this.checkPreSignedUser(userInfo.email);

    // 신규 회원인 경우 추가 정보 기입 받은 후 회원가입 및 로그인 진행
    if (!signedUserInfo) {
      const sessionId = uuidV4();

      // oauth 인증 세션
      await this.setOauthSession(sessionId, userInfo.email, 'kakao', userInfo.profile_img);

      const singUpInfo: SignUpInfo = {
        need_sign_up: true,
        session_id: sessionId,
        ...userInfo,
      };

      return singUpInfo;
    } else {
      // user Provider 추가
      if (!signedUserInfo.provider.includes('kakao')) {
        signedUserInfo.provider.push('kakao');
        await this.setProvider(signedUserInfo.id, signedUserInfo.provider);
      }

      return await this.createToken(signedUserInfo.id);
    }
  }
}
