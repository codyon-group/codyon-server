import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv } from 'crypto';

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
    const cipher = createCipheriv(this.ALGORITHM, this.KEY, this.IV);

    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  }

  decrypt(encrypted: string): string {
    const decipher = createDecipheriv(this.ALGORITHM, this.KEY, this.IV);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  decryptList(encryptedList: string[]): string[] {
    encryptedList.forEach((x, idx) => {
      encryptedList[idx] = this.decrypt(x);
    });

    return encryptedList;
  }
}
