import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';

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
        throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 해당 항목들이 존재하는 지 확인.
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

  // 좋아요 개수만 필요한 경우
  async getLikeTotalNum(category: string, categoryId: string): Promise<void> {
    await this.checkContents(category, categoryId);

    try {
      await this.dbService.like.count({
        where: {
          category: this.setCategory(category),
          category_id: categoryId,
        },
      });
    } catch (err) {
      console.error(`getLikeTotalNum: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
