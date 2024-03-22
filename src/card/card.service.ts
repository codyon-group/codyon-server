import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { CARD, PROFILE, S3Service } from '../s3/s3.service';
import { CardInfo, CardUserInfo, DetailCardInfo, ResDetailCardInfo } from './type';

@Injectable()
export class CardService {
  constructor(
    private dbService: DbService,
    private s3Service: S3Service,
  ) {}

  setDetailFashionCardInfo(data: DetailCardInfo): ResDetailCardInfo {
    const profileImg = data.user.UserProfile.img_url;

    delete data.user.UserProfile.img_url;

    const result: ResDetailCardInfo = {
      id: data.id,
      user_id: data.user_id,
      card_img: this.s3Service.getObjectKey(CARD, data.img_key),
      created_time: data.created_time,
      user_profile: {
        ...data.user.UserProfile,
        profile_img: this.s3Service.getObjectKey(PROFILE, profileImg),
      },
    };

    return result;
  }

  async getFashionCard(cardId: string): Promise<ResDetailCardInfo> {
    try {
      const result = await this.dbService.fashionCard
        .findUniqueOrThrow({
          include: {
            user: {
              select: {
                UserProfile: {
                  select: {
                    nick_name: true,
                    img_url: true,
                    height: true,
                    weight: true,
                    feet_size: true,
                    mbti: true,
                  },
                },
              },
            },
          },
          where: {
            id: cardId,
          },
        })
        .then((data: DetailCardInfo) => {
          return this.setDetailFashionCardInfo(data);
        });

      return result;
    } catch (err) {
      console.error(`getFashionCard: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserInfo(userId: string): Promise<CardUserInfo> {
    try {
      const result = await this.dbService.profile.findUniqueOrThrow({
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

  /**
   * 1. 있는 게시물인지 확인할 것
   * 2. 해당 게시물이 해당 유저의 소유인지 확인할 것
   */
  async getFashionCardInfo(cardId: string): Promise<CardInfo> {
    try {
      const cardInfo = await this.dbService.fashionCard.findUniqueOrThrow({
        select: { user_id: true, img_key: true },
        where: {
          id: cardId,
        },
      });

      return cardInfo;
    } catch (err) {
      console.error(`getFashionCardInfo: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFashionCard(userId: string, cardId: string): Promise<void> {
    const cardInfo = await this.getFashionCardInfo(cardId);

    if (cardInfo.user_id !== userId) {
      throw new ErrorHandler(ErrorCode.FORBIDDEN, {}, '직접 등록한 게시물만 지울 수 있습니다.');
    }
    const cardKey = this.s3Service.setObjectKey(CARD, cardInfo.img_key);
    await this.s3Service.deleteImg(cardKey);

    try {
      await this.dbService.fashionCard.delete({
        where: {
          id: cardId,
          user_id: userId,
        },
      });
    } catch (err) {
      console.error(`deleteFashionCard: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}