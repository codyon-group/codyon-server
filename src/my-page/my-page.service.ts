import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { UserProfile, UserRelationCnt } from './type';

@Injectable()
export class MyPageService {
  constructor(private dbService: DbService) {}

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userProfile = await this.dbService.profile.findUniqueOrThrow({
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
}
