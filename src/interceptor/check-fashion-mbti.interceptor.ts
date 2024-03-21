import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';

@Injectable()
export class CheckFashionMbti implements NestInterceptor {
  constructor(private dbService: DbService) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<void>> {
    const userId = context.switchToHttp().getRequest().user.id;
    const checkMbti = await this.dbService.profile
      .findFirstOrThrow({
        select: {
          mbti: true,
        },
        where: {
          user_id: userId,
        },
      })
      .then((data) => data.mbti == null)
      .catch((err) => {
        console.error(`checkMbti: ${err.message}`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
      });

    if (checkMbti) {
      throw new ErrorHandler(
        ErrorCode.FORBIDDEN,
        'mbti',
        '패션 mbti를 먼저 진행해야 해당 기능을 이용하실 수 있습니다.',
      );
    }

    return next.handle().pipe();
  }
}
