import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';

export const PROFILE = 'profile';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private cdn: string;
  private profileFolder: string;

  constructor(private configService: ConfigService) {
    const s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESSKEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESSKEY'),
      },
    });

    this.s3Client = s3Client;
    this.bucket = this.configService.get('AWS_S3_BUCKET');
    this.cdn = this.configService.get('AWS_CDN_DOMIN');
    this.profileFolder = this.configService.get('AWS_S3_FOLDER_PROFILE');
  }

  get client(): S3Client {
    return this.s3Client;
  }

  setObjectKey(type: string, key: string): string {
    switch (type) {
      case PROFILE:
        return `${this.profileFolder}${key}`;
      default:
        console.error(`setObjectKey: not defined object type`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  getObjectKey(type: string, key: string): string {
    switch (type) {
      case PROFILE:
        // oauth login시 등록한 profile인 경우
        if (key.startsWith('http')) return key;
        return `${this.cdn}${this.profileFolder}${key}`;
      default:
        console.error(`getObjectKey: not defined object type`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadImg(key: string, file: Express.Multer.File): Promise<void> {
    try {
      const params = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(params);
    } catch (err) {
      console.error(`uploadImg: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteImg(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (err) {
      console.error(`deleteImg: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
