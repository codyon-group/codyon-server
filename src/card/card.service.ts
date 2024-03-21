import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { CardUserInfo } from './type';
import { CARD, S3Service } from '../s3/s3.service';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class CardService {
  constructor(
    private dbService: DbService,
    private s3Service: S3Service,
  ) {}

  async getUserInfo(userId: string): Promise<CardUserInfo> {
    try {
      const result = await this.dbService.profile.findFirstOrThrow({
        select: {
          nick_name: true,
          height: true,
          weight: true,
          feet_size: true,
          sns_id: true,
          mbti: true,
        },
        where: { user_id: userId },
      });

      return result;
    } catch (err) {
      console.error(`getUserInfo: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createFashionCard(userId: string, cardImg: Express.Multer.File): Promise<void> {
    const key = uuidV4();
    const imgKey = this.s3Service.setObjectKey(CARD, key);

    await this.s3Service.uploadImg(imgKey, cardImg);

    try {
      await this.dbService.fashionCard.create({
        data: {
          user_id: userId,
          img_key: key,
        },
      });
    } catch (err) {
      console.error(`createFashionCard: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
