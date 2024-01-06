import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { verify } from 'argon2';
import dayjs from 'dayjs';
import { CacheService } from '../cache/cache.service';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode, ErrorDetailCode } from '../exception/error.type';
import { AccessTokenInfo, RefreshTokenInfo, UserInfo, UserTokenInfo } from './type';

const REFRESH_TOKEN = 'refresh-token:';

@Injectable()
export class AuthService {
  private ACCESSTOKEN_EXPIRE: number;
  private REFRESHTOKEN_EXPIRE: number;
  private ACCESSTOKEN_SECRET: string;
  private REFRESHTOKEN_SECRET: string;

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
}
