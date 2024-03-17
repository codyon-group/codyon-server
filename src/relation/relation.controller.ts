import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RelationService } from './relation.service';
import { UserReq } from '../auth/type';
import { Pagination, ResUserList } from './type';
import { RelationByStatus } from './dto/get-user-relation.dto';
import { PROFILE, S3Service } from '../s3/s3.service';
import { Follow } from './dto/follow-user.dto';
import { UnFollow } from './dto/unfollow-user.dto';
import { DelFollower } from './dto/del-follower.dto';
import { Bolck } from './dto/block-user.dto';
import { UnBolck } from './dto/unblock-user.dto';

@Controller('api/relation')
@UseGuards(AuthGuard)
export class RelationController {
  constructor(
    private relationService: RelationService,
    private s3Service: S3Service,
  ) {}

  // 팔로우, 팔로잉, 차단목록 조회
  @Get()
  async getUserRealtionByStatus(
    @Req() req: UserReq,
    @Query() data: RelationByStatus,
  ): Promise<{ pagination: Pagination; data: ResUserList[] }> {
    const result = await this.relationService.getUserRealtionByStatus(
      data.status,
      req.user.id,
      data.limit,
      data.cursor,
    );

    if (!result.length) {
      return {
        pagination: { cursor: null, is_end: true },
        data: [],
      };
    }

    const pagination = {
      cursor: result[result.length - 1].id.toString(),
      is_end: result.length < Number(data.limit || 100),
    };

    const relationList = result.map((x) => {
      const userProfile = x?.toUser?.UserProfile || x?.fromUser?.UserProfile;

      userProfile.img_url = this.s3Service.getObjectKey(PROFILE, userProfile.img_url);

      return {
        id: x.id.toString(),
        user_profile: userProfile,
      };
    });

    return { pagination, data: relationList };
  }

  @Post('follow')
  async follow(@Req() req: UserReq, @Body() data: Follow): Promise<{ success: boolean }> {
    await this.relationService.follow(req.user.id, data.user_id);

    return { success: true };
  }

  @Delete('unfollow')
  async unFollow(@Req() req: UserReq, @Query() data: UnFollow): Promise<{ success: boolean }> {
    await this.relationService.unFollow(req.user.id, data.user_id);

    return { success: true };
  }

  // 팔로워 삭제 -> 상대 유저 팔로잉 목록에서 삭제
  @Delete('follower')
  async deleteFollwer(
    @Req() req: UserReq,
    @Query() data: DelFollower,
  ): Promise<{ success: boolean }> {
    await this.relationService.deleteFollower(data.user_id, req.user.id);

    return { success: true };
  }

  // 차단  => 양쪽 follow 취소
  @Post('block')
  async blockUser(@Req() req: UserReq, @Body() data: Bolck): Promise<{ success: boolean }> {
    await this.relationService.block(req.user.id, data.user_id);

    return { success: true };
  }

  @Delete('unblock')
  async unBlock(@Req() req: UserReq, @Query() data: UnBolck): Promise<{ success: boolean }> {
    await this.relationService.unBlock(req.user.id, data.user_id);

    return { success: true };
  }
}
