import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = randomBytes(32);
const IV = randomBytes(16);

@Injectable()
export class CommonService {
  encrypt(value: string): string {
    const cipher = createCipheriv(ALGORITHM, KEY, IV);

    let encrypted = cipher.update(value, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  }

  decrypt(encrypted: string): string {
    const decipher = createDecipheriv(ALGORITHM, KEY, IV);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
