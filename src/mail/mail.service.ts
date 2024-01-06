import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { CacheService } from '../cache/cache.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { MailFormat } from './type';

const SIGN_UP = 'signUp';
const AUTH_MAIL = 'auth-mail:';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private cacheService: CacheService,
  ) {}

  // 랜덤으로 된 4자리 숫자.
  createAuthCode(): string {
    return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  }

  setMailFormat(title: string): MailFormat {
    let subject = '';
    let template = '';

    switch (title) {
      case SIGN_UP:
        subject = 'CodyOn 회원가입 인증 메일';
        template = './sign-up-mail';
        break;
      default:
        console.error(`setMailFormat: not defined subject`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return { subject, template };
  }

  async sendMail(
    email: string,
    subject: string,
    template: string,
    context?: { [key: string]: string },
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        template,
        context,
      });
    } catch (err) {
      console.error(`sendMail: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async sendSingUpAuthMail(email: string): Promise<string> {
    const { subject, template } = this.setMailFormat(SIGN_UP);
    const code = this.createAuthCode();

    // 인증 메일 전송
    await this.sendMail(email, subject, template, { auth_code: code });

    // 인증 정보 저장
    const sessionId = uuidV4();

    const key = AUTH_MAIL + sessionId;
    const values = [
      ['email', email],
      ['code', code],
      ['resend', 0],
      ['retry', 0],
    ] as [field: string, value: unknown][];

    // 3분 + 여유시간 10초
    await this.cacheService.hMSet(key, values, 3 * 60 + 10);

    return sessionId;
  }

  async resendSignUpAuthMail(sessionId: string): Promise<void> {
    const key = AUTH_MAIL + sessionId;
    const { email, resend } = (await this.cacheService.hMGet(key, ['email', 'resend'])) as {
      email: string;
      resend: number;
    };

    if (resend == null) {
      throw new ErrorHandler(ErrorCode.UNAUTHORIZED);
    }

    if (resend >= 3) {
      throw new ErrorHandler(
        ErrorCode.BAD_REQUEST,
        'resend_count',
        '재전송 횟수는 3회를 초과할 수 없습니다. 처음부터 다시 시도해주세요',
      );
    }

    const code = this.createAuthCode();
    const { subject, template } = this.setMailFormat(SIGN_UP);
    // 인증 메일 재전송
    await this.sendMail(email, subject, template, { auth_code: code });

    const values = [
      ['code', code],
      ['resend', resend + 1],
      ['retry', 0],
    ] as [field: string, value: unknown][];

    // 인증 정보 수정 3분 + 여유시간 10초
    await this.cacheService.hMSet(key, values, 3 * 60 + 10);
  }

  async validateSignUpAuthMail(sessionId: string, authCode: string): Promise<boolean> {
    const key = AUTH_MAIL + sessionId;
    const { retry, code } = (await this.cacheService.hMGet(key, ['code', 'retry'])) as {
      retry: number;
      code: string;
    };

    if (retry == null || code == null) {
      throw new ErrorHandler(ErrorCode.UNAUTHORIZED);
    }

    if (retry >= 3) {
      throw new ErrorHandler(
        ErrorCode.BAD_REQUEST,
        'retry_count',
        '인증 번호 확인 횟수는 3회를 초과할 수 없습니다. 처음부터 다시 시도해주세요',
      );
    }

    if (authCode !== code) {
      await this.cacheService.hSet(key, 'retry', retry + 1);
      throw new ErrorHandler(ErrorCode.INVALID_ARGUMENT, 'code', '인증번호가 일치하지 않습니다.');
    }

    // 인증 유효시간 10분
    await this.cacheService.hSet(key, 'status', 'confirmed', 10 * 60);

    return true;
  }
}
