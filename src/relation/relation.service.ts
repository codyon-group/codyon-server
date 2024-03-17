import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { Conditions, UserList } from './type';

const FOLLOW = 'FOLLOW';
const BLOCK = 'BLOCK';

@Injectable()
export class RelationService {
  constructor(private dbService: DbService) {}

  async getFollowerList(
    conditions: Conditions,
    limit: string = '100',
    cursor?: string,
  ): Promise<Array<UserList>> {
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

      const data = await this.dbService.userRelation.findMany({
        select: {
          id: true,
          fromUser: {
            select: {
              UserProfile: {
                select: {
                  user_id: true,
                  img_url: true,
                  nick_name: true,
                  height: true,
                  weight: true,
                  feet_size: true,
                  mbti: true,
                },
              },
            },
          },
        },
        where: conditions,
        ...cursorData,
        take: Number(limit),
        orderBy: {
          id: 'desc',
        },
      });

      return data as unknown as UserList[];
    } catch (err) {
      console.error(`getFollowerList: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  // 내가 following하는 사람 목록
  async getFollowingList(
    conditions: Conditions,
    limit: string = '100',
    cursor?: string,
  ): Promise<Array<UserList>> {
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

      const data = await this.dbService.userRelation.findMany({
        select: {
          id: true,
          toUser: {
            select: {
              UserProfile: {
                select: {
                  user_id: true,
                  img_url: true,
                  nick_name: true,
                  height: true,
                  weight: true,
                  feet_size: true,
                  mbti: true,
                },
              },
            },
          },
        },
        where: conditions,
        ...cursorData,
        take: Number(limit),
        orderBy: {
          id: 'desc',
        },
      });

      return data as unknown as UserList[];
    } catch (err) {
      console.error(`getFollowingList: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getBlockList(
    conditions: Conditions,
    limit: string = '100',
    cursor?: string,
  ): Promise<Array<UserList>> {
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

      const data = await this.dbService.userRelation.findMany({
        select: {
          id: true,
          toUser: {
            select: {
              UserProfile: {
                select: {
                  user_id: true,
                  img_url: true,
                  nick_name: true,
                  height: true,
                  weight: true,
                  feet_size: true,
                  mbti: true,
                },
              },
            },
          },
        },
        where: conditions,
        ...cursorData,
        take: Number(limit),
        orderBy: {
          id: 'desc',
        },
      });

      return data as unknown as UserList[];
    } catch (err) {
      console.error(`getBlockList: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserRealtionByStatus(
    status: string,
    userId: string,
    limit?: string,
    cursor?: string,
  ): Promise<Array<UserList>> {
    switch (status) {
      case 'follower': // user를 follow한 목록
        return await this.getFollowerList({ type: FOLLOW, to: userId }, limit, cursor);
      case 'following': // user가 follow한 목록
        return await this.getFollowingList({ type: FOLLOW, from: userId }, limit, cursor);
      case 'block':
        return await this.getBlockList({ type: BLOCK, from: userId }, limit, cursor);
      default:
        throw new ErrorHandler(ErrorCode.INVALID_ARGUMENT, 'status');
    }
  }

  async follow(from: string, to: string): Promise<void> {
    try {
      await this.dbService.userRelation.create({
        data: {
          type: FOLLOW,
          from,
          to,
        },
      });
    } catch (err) {
      // prisma 공식 docs 참고
      if (err.code === 'P2002') {
        throw new ErrorHandler(ErrorCode.BAD_REQUEST, {}, '이미 팔로우한 유저입니다.');
      }

      console.error(`follow: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async unFollow(from: string, to: string): Promise<void> {
    try {
      await this.dbService.userRelation.delete({
        where: {
          type_from_to: {
            type: FOLLOW,
            from,
            to,
          },
        },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw new ErrorHandler(
          ErrorCode.BAD_REQUEST,
          {},
          '이미 팔로우 취소 되었거나, 팔로우하고 있는 유저가 아닙니다.',
        );
      }

      console.error(`unFollow: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFollower(from: string, to: string): Promise<void> {
    try {
      await this.dbService.userRelation.delete({
        where: {
          type_from_to: {
            type: FOLLOW,
            from,
            to,
          },
        },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw new ErrorHandler(
          ErrorCode.BAD_REQUEST,
          {},
          '이미 팔로워 삭제 되었거나, 나를 팔로우하고 있는 유저가 아닙니다.',
        );
      }
      console.error(`deleteFollower: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getEachUserRelation(from: string, to: string): Promise<Array<bigint>> {
    try {
      const result = await this.dbService.userRelation.findMany({
        select: { id: true },
        where: {
          OR: [
            {
              type: FOLLOW,
              from,
              to,
            },
            {
              type: FOLLOW,
              from: to,
              to: from,
            },
          ],
        },
      });

      return result.map((x) => x.id);
    } catch (err) {
      console.error(`getUserRelation: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async block(from: string, to: string): Promise<void> {
    try {
      const relationIds = await this.getEachUserRelation(from, to);

      await this.dbService.$transaction(async (tx) => {
        await tx.userRelation.create({
          data: {
            type: BLOCK,
            from,
            to,
          },
        });

        // block시 서로의 follow 목록에서 삭제
        await tx.userRelation.deleteMany({
          where: {
            id: { in: relationIds },
          },
        });
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new ErrorHandler(ErrorCode.BAD_REQUEST, {}, '이미 차단한 유저입니다.');
      }

      console.error(`blockUser: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  async unBlock(from: string, to: string): Promise<void> {
    try {
      await this.dbService.userRelation.delete({
        where: {
          type_from_to: {
            type: 'BLOCK',
            from,
            to,
          },
        },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw new ErrorHandler(
          ErrorCode.BAD_REQUEST,
          {},
          '이미 차단 해제 되었거나, 차단하고 있는 유저가 아닙니다.',
        );
      }
      console.error(`unBlock: ${err.message}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
