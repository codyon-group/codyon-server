import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';
import { AuthService } from '../auth/auth.service';
import { UserTokenInfo } from '../auth/type';
import { CacheService } from '../cache/cache.service';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { SingUpDetails } from './dto/sign-up-details.dto';
import { SignUp } from './dto/sign-up.dto';
import { CreateOauthUser, CreateUser } from './type';
import { CommonService } from '../common/common.service';

@Injectable()
export class UserService {
  constructor(
    private dbService: DbService,
    private cacheService: CacheService,
    private authService: AuthService,
    private commonService: CommonService,
  ) {}

  async checkDuplicateEmail(email: string): Promise<boolean> {
    try {
      const result = await this.dbService.user
        .findFirst({
          where: {
            email,
          },
          select: { id: true },
        })
        .then((v) => {
          return Boolean(v);
        });

      return result;
    } catch (err) {
      console.error(err.message);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkDuplicateNickName(nickName: string): Promise<boolean> {
    try {
      const result = await this.dbService.profile
        .findFirst({
          select: {
            nick_name: true,
          },
          where: {
            nick_name: nickName,
          },
        })
        .then((v) => {
          return Boolean(v);
        });

      return result;
    } catch (err) {
      console.error(`checkDuplicateNickName: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkFavoriteStyle(styleIds: string[]): Promise<boolean> {
    try {
      const styleCnt = await this.dbService.style.count({
        where: {
          id: { in: styleIds },
        },
      });

      return styleCnt === styleIds.length;
    } catch (err) {
      console.error(`checkFavoriteStyle: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkSession(sessionId: string, email: string): Promise<boolean> {
    const key = `auth-mail:${sessionId}`;
    const values = (await this.cacheService.hMGet(key, ['email', 'status'])) as {
      email: string;
      status: string;
    };

    return email === values.email && values.status === 'confirmed';
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const passwordHash = await hash(password);

      return passwordHash;
    } catch (err) {
      console.error(`hashPassword: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createUser(data: CreateUser): Promise<void> {
    try {
      await this.dbService.$transaction(async (tx) => {
        const { id: userId } = await tx.user.create({
          data: {
            email: data.email,
            password: data.password,
          },
          select: {
            id: true,
          },
        });

        await tx.profile.create({
          data: {
            user_id: userId,
            nick_name: data.nickName,
            height: data.height,
            weight: data.weight,
            feet_size: data.feetSize,
            gender: data.gender,
            favorite_style: data.styles,
            sns_id: data.snsId,
          },
        });
      });
    } catch (err) {
      console.error(`createUser: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async signUp(data: SignUp): Promise<boolean> {
    // 세션 아이디 검증
    const checkSession = await this.checkSession(data.session_id, data.email);

    if (!checkSession) {
      // 세션 만료
      throw new ErrorHandler(ErrorCode.UNAUTHORIZED);
    }

    // email 중복 확인
    const isDuplicateEmail = await this.checkDuplicateEmail(data.email);

    if (isDuplicateEmail) {
      throw new ErrorHandler(ErrorCode.DUPLICATED, 'email', '이미 가입된 이메일입니다.');
    }

    // 비밀번호 일치여부 확인
    if (data.password !== data.confirm_password) {
      throw new ErrorHandler(
        ErrorCode.INVALID_ARGUMENT,
        'password',
        '비밀번호가 일치하지 않습니다.',
      );
    }

    // 닉네임 중복 확인
    const isDuplicateNickName = await this.checkDuplicateNickName(data.nick_name);

    if (isDuplicateNickName) {
      throw new ErrorHandler(ErrorCode.DUPLICATED, 'nick_name', '사용중인 닉네임입니다.');
    }

    // favorite_style 확인 -> array type 원소 fk check 안됨
    const decryptedStyle = this.commonService.decryptList(data.styles);
    const isValidStyleList = await this.checkFavoriteStyle(decryptedStyle);

    if (!isValidStyleList) {
      throw new ErrorHandler(ErrorCode.NOT_FOUND, 'style_tag');
    }

    // 비밀번호 암호화
    const hashedPassword = await this.hashPassword(data.password);

    // 회원가입 진행
    const userProfile: CreateUser = {
      email: data.email,
      password: hashedPassword,
      nickName: data.nick_name,
      height: data.height,
      weight: data.weight,
      feetSize: data.feet_size,
      gender: data.gender,
      styles: decryptedStyle,
      snsId: data.sns_id,
    };

    await this.createUser(userProfile);

    return true;
  }

  async checkOauthSession(
    sessionId: string,
  ): Promise<{ email: string; provider: string; profile_img?: string }> {
    const key = `oauth-sign-up:${sessionId}`;
    const values = (await this.cacheService.hGetAll(key)) as {
      email: string;
      provider: string;
      profile_img?: string;
    };

    return values;
  }

  async createOauthUser(data: CreateOauthUser): Promise<string> {
    try {
      const userId = await this.dbService.$transaction(async (tx) => {
        const { id: userId } = await tx.user.create({
          data: {
            email: data.email,
            provider: [data.provider],
          },
          select: {
            id: true,
          },
        });

        await tx.profile.create({
          data: {
            user_id: userId,
            nick_name: data.nickName,
            img_url: data.img_url,
            height: data.height,
            weight: data.weight,
            feet_size: data.feetSize,
            gender: data.gender,
            favorite_style: data.styles,
            sns_id: data.snsId,
          },
        });

        return userId;
      });

      return userId;
    } catch (err) {
      console.error(`createOauthUser: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async setDetails(data: SingUpDetails): Promise<UserTokenInfo> {
    const oauthSession = await this.checkOauthSession(data.session_id);

    if (!oauthSession) {
      // 세션 만료
      throw new ErrorHandler(ErrorCode.UNAUTHORIZED);
    }

    // 닉네임 중복 확인
    const isDuplicateNickName = await this.checkDuplicateNickName(data.nick_name);

    if (isDuplicateNickName) {
      throw new ErrorHandler(ErrorCode.DUPLICATED, 'nick_name', '사용중인 닉네임입니다.');
    }

    // favorite_style 확인 -> array type 원소 fk check 안됨
    const decryptedStyle = this.commonService.decryptList(data.styles);
    const isValidStyleList = await this.checkFavoriteStyle(decryptedStyle);

    if (!isValidStyleList) {
      throw new ErrorHandler(ErrorCode.NOT_FOUND, 'style_tag');
    }

    // 회원가입 진행
    const userProfile: CreateOauthUser = {
      email: oauthSession.email,
      provider: oauthSession.provider,
      img_url: oauthSession.profile_img,
      nickName: data.nick_name,
      height: data.height,
      weight: data.weight,
      feetSize: data.feet_size,
      gender: data.gender,
      styles: decryptedStyle,
      snsId: data.sns_id,
    };

    // 회원가입
    const userId = await this.createOauthUser(userProfile);
    // 로그인 및 token 발급
    const tokenInfo = await this.authService.createToken(userId);

    return tokenInfo;
  }
}
