import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { IS_DEFINED, IS_NOT_EMPTY } from 'class-validator';
import { Response } from 'express';
import {
  Details,
  ErrorCode,
  ErrorDetailCode,
  ErrorDetails,
  ErrorFormat,
  ErrorMsg,
} from './error.type';

function setErrorDetails(details: string, ErrorDetailCode: ErrorDetailCode): ErrorDetails {
  const errorDetail = {
    field: details,
    code: ErrorDetailCode,
  };

  return errorDetail;
}

function setErrorCode(status: number): string {
  return Object.keys(HttpStatus).find((key) => HttpStatus[key] === status);
}

export function setValidatorError(
  errorOption: { [key: string]: string },
  errorProperty: string,
): {
  code: ErrorCode;
  detailCode: ErrorDetailCode;
  msg?: string;
} {
  const errorCode = Object.keys(errorOption)[0];
  let code: ErrorCode;
  let detailCode: ErrorDetailCode;
  let msg: string;

  switch (errorCode) {
    case IS_DEFINED:
    case IS_NOT_EMPTY:
      code = ErrorCode.INVALID_ARGUMENT;
      detailCode = ErrorDetailCode.MISSING;
      msg = ErrorMsg.MISSING;
      break;
    default:
      code = ErrorCode.INVALID_ARGUMENT;
      detailCode = ErrorDetailCode.INVALID;
      msg = ErrorMsg.INVALID;
      break;
  }

  const detail = {} as ErrorDetailCode;

  detail[errorProperty] = detailCode;

  // dto 내 에러메세지를 정의한 경우 고려
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/gi.test(Object.values(errorOption)[0])) {
    msg = Object.values(errorOption)[0];
  }

  return { code, detailCode: detail, msg };
}

export class ErrorHandler extends HttpException {
  private errorCode: string;
  private errorDetailCode: ErrorDetailCode;
  private errorDetails: ErrorDetails;

  constructor(errorCode: string, details?: string | Details, message?: string) {
    let msg: string;
    switch (errorCode) {
      case ErrorCode.INVALID_ARGUMENT:
        msg = message || ErrorMsg.INVALID;
        super(msg, HttpStatus.BAD_REQUEST);
        this.errorDetailCode = ErrorDetailCode.INVALID;
        break;
      case ErrorCode.BAD_REQUEST:
        msg = message || ErrorMsg.BAD_REQUEST;
        super(msg, HttpStatus.BAD_REQUEST);
        this.errorDetailCode = ErrorDetailCode.INVALID;
        break;
      case ErrorCode.UNAUTHORIZED:
        msg = message || ErrorMsg.UNAUTHORIZED;
        super(msg, HttpStatus.UNAUTHORIZED);
        this.errorDetailCode = ErrorDetailCode.UNAUTHORIZED;
        break;
      case ErrorCode.NOT_FOUND:
        msg = message || ErrorMsg.NOT_FOUND;
        super(msg, HttpStatus.NOT_FOUND);
        this.errorDetailCode = ErrorDetailCode.NOT_FOUND;
        break;
      case ErrorCode.FORBIDDEN:
        msg = message || ErrorMsg.FORBIDDEN;
        super(msg, HttpStatus.FORBIDDEN);
        this.errorDetailCode = ErrorDetailCode.FORBIDDEN;
        break;
      default:
        super(ErrorMsg.UNHANDLED, HttpStatus.INTERNAL_SERVER_ERROR);
        break;
    }

    this.errorCode = errorCode || ErrorCode.INTERNAL_SERVER_ERROR;

    if (typeof details === 'string' && details != null) {
      this.errorDetails = setErrorDetails(details, this.errorDetailCode);
    } else if (typeof details === 'object' && details != null && Object.keys(details).length) {
      const [field, code] = Object.entries(details)[0];

      this.errorDetails = { field, code };
    }
  }

  get code(): string {
    return this.errorCode;
  }

  get details(): ErrorDetails {
    if (this.errorDetails !== undefined) {
      return this.errorDetails;
    }
  }
}

@Catch(ErrorHandler, HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: ErrorHandler | HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ErrorHandler) {
      const status = exception.getStatus();
      const error: ErrorFormat = {
        code: exception.code,
        message: exception.message,
        details: exception.details || null,
      };
      res.status(status).json(error);
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      // HttpException 속성의 예상하지 못한 에러 예외처리
      const error: ErrorFormat = {
        code: `${setErrorCode(status)}_ERROR`,
        message: exception.message,
        details: null,
      };

      res.status(status).json(error);
    } else {
      console.error('Unhandled exception:', exception);

      // 예상하지 못한 에러 예외처리
      const error: ErrorFormat = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: exception.message,
        details: null,
      };

      res.status(500).json(error);
    }
  }
}
