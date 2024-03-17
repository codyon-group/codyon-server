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
}
