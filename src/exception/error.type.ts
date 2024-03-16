/* eslint-disable */
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST_ERROR',
  DUPLICATED = 'DUPLICATED_ERROR',
  FORBIDDEN = 'FORBIDDEN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED_ERROR',
}

export enum ErrorDetailCode {
  ALREADY_EXIST = 'ALREADY_EXIST',
  DUPLICATED = 'DUPLICATED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID = 'INVALID',
  MISSING = 'MISSING',
  NOT_FOUND = 'NOT_FOUND',
  NOT_MATCHED = 'NOT_MATCHED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNAVAILABLE = 'UNAVAILABLE',
  EXPIRED = 'EXPIRED',
}

export enum ErrorMsg {
  BAD_REQUEST = '잘못된 요청입니다. 다시 한번 확인해 주세요.',
  DUPLICATED = '중복된 정보입니다.',
  FORBIDDEN = '올바르지 않은 접근입니다.',
  INVALID = '정보가 올바르지 않습니다. 다시 한번 확인해 주세요.',
  MISSING = '필수 정보가 기입되지 않았습니다. 다시 한번 확인해 주세요.',
  NOT_FOUND = '존재하지 않는 정보입니다.',
  UNAUTHORIZED = '올바르지 않은 인증 정보입니다.',
  UNHANDLED = '알 수 없는 에러입니다. 고객센터에 문의하시기 바랍니다.',
}
/* eslint-eable */

export class Details {
  [key: string]: ErrorDetailCode;
}

export class ErrorDetails {
  field: string;
  code: ErrorDetailCode;
}

export class ErrorFormat {
  code: string;
  details?: ErrorDetails;
  message: string;
}
