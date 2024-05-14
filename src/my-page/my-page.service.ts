import { Injectable } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { PROFILE, S3Service } from '../s3/s3.service';
import { ChangeProfile } from './dto/change-profile.dto';
import { ChangeUserProfile, UserProfile, UserRelationCnt } from './type';

@Injectable()
export class MyPageService {
  constructor(
    private dbService: DbService,
    private s3Service: S3Service,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userProfile = await this.dbService.profile
        .findUniqueOrThrow({
          select: {
            nick_name: true,
            img_url: true,
            description: true,
            gender: true,
            height: true,
            weight: true,
            feet_size: true,
            sns_id: true,
            favorite_style: true,
            mbti: true,
          },
          where: {
            user_id: userId,
          },
        })
        .then((data) => {
          return { ...data, img_url: this.s3Service.getObjectKey(PROFILE, data.img_url) };
        });

      return userProfile;
    } catch (err) {
      // prisma docs 참조
      if (err.code === 'P2025') {
        throw new ErrorHandler(ErrorCode.UNAUTHORIZED, {}, '회원정보를 찾을 수 없습니다.');
      }

      console.error(`getUserProfile: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserRealationship(userId: string): Promise<UserRelationCnt> {
    try {
      // 나를 follow한 사람
      const follower = await this.dbService.userRelation.count({
        where: {
          type: 'FOLLOW',
          to: userId,
        },
      });

      // 내가 follow한 사람
      const following = await this.dbService.userRelation.count({
        where: {
          type: 'FOLLOW',
          from: userId,
        },
      });

      return {
        follower,
        following,
      };
    } catch (err) {
      console.error(`getUserRealationship: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getEnrolledItemCnt(userId: string): Promise<number> {
    try {
      return await this.dbService.item.count({
        where: {
          user_id: userId,
        },
      });
    } catch (err) {
      console.error(`getEnrolledItemCnt: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkDuplicateNickName(userId: string, nickName: string): Promise<boolean> {
    try {
      const isDuplicate = await this.dbService.profile.count({
        where: {
          nick_name: nickName,
          NOT: {
            user_id: userId,
          },
        },
      });

      return isDuplicate > 0;
    } catch (err) {
      console.error(`checkDuplicateNickName: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async checkFavoriteStyle(styleIds: string[]): Promise<boolean> {
    try {
      const styleCnt = await this.dbService.style.count({
        where: {
          id: { in: styleIds },
        },
      });

      return styleCnt === styleIds.length;
    } catch (err) {
      console.error(`checkFavoriteStyle: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async changeUserProfile(userId: string, data: ChangeUserProfile): Promise<void> {
    try {
      await this.dbService.profile.update({
        data,
        where: {
          user_id: userId,
        },
      });
    } catch (err) {
      console.error(`changeUserProfile: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async changeProfile(
    userId: string,
    data: ChangeProfile,
    profileImg?: Express.Multer.File,
  ): Promise<void> {
    const profileData = { ...data } as ChangeUserProfile;

    if (profileImg != null) {
      const key = uuidV4();
      const imgKey = this.s3Service.setObjectKey(PROFILE, key);

      await this.s3Service.uploadImg(imgKey, profileImg);
      profileData['img_url'] = key;
    }

    await this.changeUserProfile(userId, profileData);
  }
}
