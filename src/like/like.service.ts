import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import dayjs from 'dayjs';

const LOOKBOOK = 'LOOKBOOK';
const CARD = 'FASHION_CARD';
const COMMENT = 'COMMENT';

@Injectable()
export class LikeService {
  constructor(private dbService: DbService) {}

  // 좋아요 가능 항목 확인
  setCategory(category: string): string {
    switch (category) {
      case 'lookbook':
        return LOOKBOOK;
      case 'card':
        return CARD;
      case 'comment':
        return COMMENT;
      default:
        console.error(`setCategory: not defined category type`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 해당 항목들이 존재하는 지 확인 => 한 개의 column엔 다중 fk가 안되기 때문에 확인 필요
  async checkContents(category: string, categoryId: string): Promise<void> {
    try {
      switch (category) {
        case 'lookbook':
          await this.dbService.lookbook.findUniqueOrThrow({ where: { id: categoryId } });
          break;
        case 'card':
          await this.dbService.fashionCard.findUniqueOrThrow({ where: { id: categoryId } });
          break;
        case 'comment':
          await this.dbService.comment.findUniqueOrThrow({ where: { id: categoryId } });
          break;
        default:
          console.error(`checkContents: not defined category type`);
          throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
      }
    } catch (err) {
      if (err.code === 'P2025') {
        throw new ErrorHandler(ErrorCode.NOT_FOUND, 'category_id');
      }

      console.error(`check: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async like(userId: string, category: string, categoryId: string): Promise<void> {
    await this.checkContents(category, categoryId);

    try {
      await this.dbService.like.create({
        data: {
          user_id: userId,
          category: this.setCategory(category),
          category_id: categoryId,
        },
      });
    } catch (err) {
      console.error(`like: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 사용자가 좋아요 철회
  async unLike(userId: string, category: string, categoryId: string): Promise<void> {
    await this.checkContents(category, categoryId);

    try {
      await this.dbService.like.delete({
        where: {
          user_id_category_category_id: {
            user_id: userId,
            category: this.setCategory(category),
            category_id: categoryId,
          },
        },
      });
    } catch (err) {
      console.error(`unLike: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 좋아요 개수
  async getLikeTotalNum(category: string, categoryId: string): Promise<number> {
    await this.checkContents(category, categoryId);

    try {
      const likeCnt = await this.dbService.like.count({
        where: {
          category: this.setCategory(category),
          category_id: categoryId,
        },
      });

      return likeCnt;
    } catch (err) {
      console.error(`getLikeTotalNum: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 오늘, 일주일, 한달 기간 설정
  setPeriodCondition(period: string): string {
    switch (period) {
      case 'day':
        return dayjs().subtract(1, 'day').startOf('day').toISOString();
      case 'week':
        return dayjs().subtract(1, 'week').startOf('day').toISOString();
      case 'month':
        return dayjs().subtract(1, 'month').startOf('day').toISOString();
      default:
        console.error(`setPeriodCondition: not defined period type`);
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 일정 기간동안 좋아요 한 개수만 필요한 경우
  async getLikeNumByPeriod(category: string, categoryId: string, period: string): Promise<number> {
    await this.checkContents(category, categoryId);

    try {
      const likeCnt = await this.dbService.like.count({
        where: {
          category: this.setCategory(category),
          category_id: categoryId,
          created_time: {
            gte: this.setPeriodCondition(period),
          },
        },
      });

      return likeCnt;
    } catch (err) {
      console.error(`getLikeNum: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
