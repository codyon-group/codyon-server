import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RelationService } from './relation.service';
import { UserReq } from '../auth/type';
import { Pagination, ResUserList } from './type';
import { RelationByStatus } from './dto/get-user-relation.dto';
import { PROFILE, S3Service } from '../s3/s3.service';

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
}
