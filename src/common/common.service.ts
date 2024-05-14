import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv } from 'crypto';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';

@Injectable()
export class CommonService {
  private ALGORITHM: string;
  private KEY: string;
  private IV: string;

  constructor(private configService: ConfigService) {
    this.ALGORITHM = 'aes-256-cbc';
    this.KEY = this.configService.get('ENCRYPTION_KEY');
    this.IV = this.configService.get('ENCRYPTION_IV');
  }

  encrypt(value: string): string {
    try {
      const cipher = createCipheriv(this.ALGORITHM, this.KEY, this.IV);

      let encrypted = cipher.update(value, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      return encrypted;
    } catch (err) {
      console.error(`encrypt: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  decrypt(encrypted: string): string {
    try {
      const decipher = createDecipheriv(this.ALGORITHM, this.KEY, this.IV);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err) {
      console.error(`decrypt: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  decryptList(encryptedList: string[]): string[] {
    try {
      encryptedList.forEach((x, idx) => {
        encryptedList[idx] = this.decrypt(x);
      });

      return encryptedList;
    } catch (err) {
      console.error(`decryptList: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
