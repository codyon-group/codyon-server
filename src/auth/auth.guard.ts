import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode, ErrorDetailCode } from '../exception/error.type';

@Injectable()
export class AuthGuard implements CanActivate {
  private ACCESSTOKEN_SECRET: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.ACCESSTOKEN_SECRET = this.configService.get('ACCESSTOKEN_SECRET');
  }

  extractAccessToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const accessToken = this.extractAccessToken(req);

    if (!accessToken) {
      throw new ErrorHandler(ErrorCode.UNAUTHORIZED);
    }

    const verfiedUserId = await this.verify(accessToken);

    req.user = {
      id: verfiedUserId,
      accessToken,
    };

    return true;
  }

  async verify(accessToken: string): Promise<string> {
    try {
      const verfiedUserInfo = await this.jwtService.verifyAsync(accessToken, {
        secret: this.ACCESSTOKEN_SECRET,
      });

      return verfiedUserInfo.id;
    } catch (err) {
      console.error(`verify: ${err.message}`);

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
}
