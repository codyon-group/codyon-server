import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { UserReq } from '../auth/type';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { FileValidationPipe } from '../s3/file.validation';
import { ChangeProfile } from './dto/change-profile.dto';
import { MyPageService } from './my-page.service';
import { MyPage, UserProfile } from './type';

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

  // 프로필 변경
  @UseGuards(AuthGuard)
  @Put('change/profile')
  @UseInterceptors(FileInterceptor('profile_img'))
  async changeProfile(
    @Req() req: UserReq,
    @Body() data: ChangeProfile,
    @UploadedFile(FileValidationPipe) profileImg?: Express.Multer.File,
  ): Promise<{ success: boolean }> {
    // 변경된 사항 없이 전송한 경우 오류 x
    if (Object.keys(data).length === 0 && profileImg == null) {
      return { success: true };
    }

    if (data?.nick_name != null) {
      // 닉네임 중복인지 확인
      const isDuplicateNickName = await this.myPageService.checkDuplicateNickName(
        req.user.id,
        data.nick_name,
      );

      if (isDuplicateNickName) {
        throw new ErrorHandler(ErrorCode.DUPLICATED, 'nick_name', '사용중인 닉네임입니다.');
      }
    }

    if (data?.favorite_style != null) {
      // favorite_style 확인 -> array type 원소 fk check 안됨
      const isValidStyleList = await this.myPageService.checkFavoriteStyle(data.favorite_style);
      if (!isValidStyleList) {
        throw new ErrorHandler(ErrorCode.NOT_FOUND, 'favorite_style');
      }
    }

    await this.myPageService.changeProfile(req.user.id, data, profileImg);

    return { success: true };
  }
}
