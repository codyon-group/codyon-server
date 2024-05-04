import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidV4 } from 'uuid';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { CARD, PROFILE, S3Service } from '../s3/s3.service';
import { CardList } from './dto/get-card-list.dto';
import {
  Card,
  CardDetail,
  CardInfo,
  CardUserInfo,
  DetailCardInfo,
  ResDetailCardInfo,
} from './type';

@Injectable()
export class CardService {
  constructor(
    private dbService: DbService,
    private s3Service: S3Service,
  ) {}

  setDetailFashionCardInfo(data: DetailCardInfo): ResDetailCardInfo {
    const profileImg = data.user.UserProfile.img_url;

    delete data.user.UserProfile.img_url;

    // todo like_count - like module
    const result: ResDetailCardInfo = {
      id: data.id,
      user_id: data.user_id,
      card_img: this.s3Service.getObjectKey(CARD, data.img_key),
      user_profile: {
        ...data.user.UserProfile,
        profile_img: this.s3Service.getObjectKey(PROFILE, profileImg),
      },
      created_time: data.created_time,
    };

    return result;
  }

  setWhereConditions(data: CardList): Prisma.Sql {
    let query = Prisma.sql``;

    if (data.cursor != null) {
      query = Prisma.sql`${query} fc.id::uuid > ${data.cursor}::uuid AND`;
    }

    if (data.height.length > 0) {
      query = Prisma.sql`${query} up.height::int >= ${data.height[0]}::int AND
                up.height::int <= ${data.height[1]}::int AND`;
    }

    if (data.weight.length > 0) {
      query = Prisma.sql`${query} up.weight::int >= ${data.weight[0]}::int AND
                up.weight::int <= ${data.weight[1]}::int AND`;
    }

    if (data.feet_size.length > 0) {
      query = Prisma.sql`${query} up.feet_size::int >= ${data.feet_size[0]}::int AND
                up.feet_size::int <= ${data.feet_size[1]}::int AND`;
    }

    if (data.gender) {
      query = Prisma.sql`${query} up.gender = ${data.gender} AND`;
    }

    if (data.mbti) {
      query = Prisma.sql`${query} up.mbti = ${data.mbti} AND`;
    }

    if (data.style.length > 0) {
      query = Prisma.sql`${query} fc.style_tag = ANY(${data.style}::uuid[]) AND`;
    }

    if (data.search) {
      query = Prisma.sql`${query} (st.type like CONCAT('%',${data.search},'%') OR up.nick_name like CONCAT('%',${data.search},'%')) AND`;
    }

    return Prisma.sql`${query} true`;
  }

  setOrderCondition(sort?: string): Prisma.Sql {
    switch (sort) {
      case 'view':
        return Prisma.sql`views.views_count desc, fc.id asc`;
      case 'like':
        return Prisma.sql`like_count desc, fc.id asc`;
      case 'new':
      default:
        return Prisma.sql`fc.created_time desc, fc.id asc`;
    }
  }

  async getFashionCardList(data: CardList): Promise<Array<Card>> {
    try {
      const result = await this.dbService
        .$queryRaw(
          Prisma.sql`
        select
            fc.id,
            fc.img_key as card_img,
            views.views_count,
            (select count(category_id) from "like" where category_id = fc.id)::int as like_count,
            fc.created_time
          from
            fashion_card as fc
          left join
            views
          on
            views.category_id = fc.id
          inner join
            user_profile as up
          on
            fc.user_id = up.user_id
          inner join
            style_tag as st
          on
            fc.style_tag = st.id
          left join
            "like"
          on
            "like".category_id = fc.id
          where
            ${this.setWhereConditions(data)}
          order by
            ${this.setOrderCondition(data.sort)}
          limit
            ${data.limit}
        `,
        )
        .then((data: Card[]) => {
          return data.map((x) => {
            return { ...x, card_img: this.s3Service.getObjectKey(CARD, x.card_img) };
          });
        });

      return result;
    } catch (err) {
      console.error(`getFashionCardList: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getCardHistory(userId: string, limit: number, cursor?: string): Promise<Array<CardDetail>> {
    try {
      let cursorData = null;

      if (cursor != null) {
        cursorData = {
          cursor: {
            id: cursor,
          },
          skip: 1,
        };
      }

      const result = await this.dbService.fashionCard
        .findMany({
          select: {
            id: true,
            img_key: true,
            created_time: true,
          },
          where: {
            user_id: userId,
          },
          ...cursorData,
          take: limit,
          orderBy: [
            {
              created_time: 'desc',
            },
            { id: 'asc' },
          ],
        })
        .then((data) => {
          return data.map((x) => {
            return {
              id: x.id,
              card_img: this.s3Service.getObjectKey(CARD, x.img_key),
              created_time: x.created_time,
            };
          });
        });

      return result;
    } catch (err) {
      console.error(`getCardHistory: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getFashionCard(cardId: string): Promise<ResDetailCardInfo> {
    try {
      const result = await this.dbService.$transaction(async (tx): Promise<ResDetailCardInfo> => {
        await tx.views.upsert({
          where: {
            category_category_id: {
              category: 'FASHION_CARD',
              category_id: cardId,
            },
          },
          update: {
            views_count: { increment: 1 },
          },
          create: {
            category: 'FASHION_CARD',
            category_id: cardId,
          },
        });

        const data: DetailCardInfo = await tx.fashionCard.findUniqueOrThrow({
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
        });

        return this.setDetailFashionCardInfo(data);
      });

      return result;
    } catch (err) {
      if (err.code === 'P2025') {
        throw new ErrorHandler(ErrorCode.NOT_FOUND, 'card_id', '존재하지 않는 게시물입니다.');
      }

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

  async createFashionCard(
    userId: string,
    cardImg: Express.Multer.File,
    styleTag: string,
  ): Promise<string> {
    const key = uuidV4();
    const imgKey = this.s3Service.setObjectKey(CARD, key);

    await this.s3Service.uploadImg(imgKey, cardImg);

    try {
      const { id: cardId } = await this.dbService.fashionCard.create({
        select: {
          id: true,
        },
        data: {
          user_id: userId,
          img_key: key,
          style_tag: styleTag,
        },
      });

      return cardId;
    } catch (err) {
      if (err.code === 'P2003') {
        throw new ErrorHandler(ErrorCode.INVALID_ARGUMENT, 'style_tag');
      }

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
      if (err.code === 'P2025') {
        throw new ErrorHandler(ErrorCode.NOT_FOUND, 'card_id', '존재하지 않는 게시물입니다.');
      }

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
      await this.dbService.$transaction(async (tx) => {
        await tx.views.delete({
          where: {
            category_category_id: {
              category: 'FASHION_CARD',
              category_id: cardId,
            },
          },
        });

        await tx.fashionCard.delete({
          where: {
            id: cardId,
            user_id: userId,
          },
        });
      });
    } catch (err) {
      console.error(`deleteFashionCard: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
