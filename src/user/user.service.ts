import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';
import { CacheService } from '../cache/cache.service';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { SignUp } from './dto/sign-up.dto';
import { CreateUser } from './type';

@Injectable()
export class UserService {
  constructor(
    private dbService: DbService,
    private cacheService: CacheService,
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
      throw new ErrorHandler(ErrorCode.INVALID_ARGUMENT, 'email', '이미 가입된 이메일입니다.');
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
      throw new ErrorHandler(ErrorCode.INVALID_ARGUMENT, 'nick_name', '사용중인 닉네임입니다.');
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
      styles: data.styles,
      snsId: data.sns_id,
    };

    await this.createUser(userProfile);

    return true;
  }
}
