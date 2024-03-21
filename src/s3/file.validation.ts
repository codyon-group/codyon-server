import { Injectable, PipeTransform } from '@nestjs/common';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode, ErrorDetailCode, ErrorMsg } from '../exception/error.type';

const MIME_TYPES = new Set(['image/jpg', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const FILE_SIZE = 5 * 1024 ** 2;
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private optional: boolean;

  constructor(isOptional: boolean = false) {
    this.optional = isOptional;
  }

  transform(file?: Express.Multer.File): Express.Multer.File {
    if (this.optional && file == null) {
      return;
    }

    if (file == null) {
      throw new ErrorHandler(
        ErrorCode.INVALID_ARGUMENT,
        { file: ErrorDetailCode.MISSING },
        ErrorMsg.MISSING,
      );
    }

    if (!MIME_TYPES.has(file.mimetype)) {
      throw new ErrorHandler(
        ErrorCode.INVALID_ARGUMENT,
        'mime_type',
        '지원하는 파일 형식이 아닙니다.',
      );
    }

    // 이미지 크기 5Mb 제한
    if (file.size > FILE_SIZE) {
      throw new ErrorHandler(
        ErrorCode.INVALID_ARGUMENT,
        'size',
        '제한된 파일의 크기를 초과하였습니다.',
      );
    }

    return file;
  }
}

@Injectable()
export class MultiFileValidationPipe implements PipeTransform {
  transform(files: Express.Multer.File[]): Express.Multer.File[] {
    for (const file of files) {
      if (!MIME_TYPES.has(file.mimetype)) {
        throw new ErrorHandler(
          ErrorCode.INVALID_ARGUMENT,
          'mime_type',
          '지원하는 파일 형식이 아닙니다.',
        );
      }

      // 이미지 크기 5Mb 제한
      if (file.size > FILE_SIZE) {
        throw new ErrorHandler(
          ErrorCode.INVALID_ARGUMENT,
          'size',
          '제한된 파일의 크기를 초과하였습니다.',
        );
      }
    }
    return files;
  }
}
