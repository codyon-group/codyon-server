import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserReq } from '../auth/type';
import { MyPage, UserProfile } from './type';
import { MyPageService } from './my-page.service';

@Controller('api/my-page')
export class MyPageController {
  constructor(private myPageService: MyPageService) {}

  // 기본 프로필 조회
  @UseGuards(AuthGuard)
  @Get()
  async getMyPage(@Req() req: UserReq): Promise<MyPage> {
    const userId = req.user.id;
    const userProfile = await this.myPageService.getUserProfile(userId);
    const userRelation = await this.myPageService.getUserRealationship(userId);
    const enrolledItemCnt = await this.myPageService.getEnrolledItemCnt(userId);

    const userInfo = {
      nick_name: userProfile.nick_name,
      img_url: userProfile.img_url,
      height: userProfile.height,
      weight: userProfile.weight,
      feet_size: userProfile.feet_size,
      mbti: userProfile.mbti,
      follower: userRelation.follower,
      following: userRelation.following,
      item_cnt: enrolledItemCnt,
    };

    return userInfo;
  }

  // 프로필 상세 조회
  @UseGuards(AuthGuard)
  @Get('/profile')
  async getUserProfile(@Req() req: UserReq): Promise<UserProfile> {
    const userProfile = await this.myPageService.getUserProfile(req.user.id);

    return userProfile;
  }
}
