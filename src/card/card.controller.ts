import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { UserReq } from '../auth/type';
import { CheckFashionMbti } from '../interceptor/check-fashion-mbti.interceptor';
import { FileValidationPipe } from '../s3/file.validation';
import { CardService } from './card.service';
import { CardUserInfo } from './type';

@Controller('api/fashion-card')
export class CardController {
  constructor(private cardService: CardService) {}
  // 카드 등록 전 사용자 자동 입력값 조회
  @UseInterceptors(CheckFashionMbti)
  @UseGuards(AuthGuard)
  @Get('user-info')
  async getUserInfo(@Req() req: UserReq): Promise<CardUserInfo> {
    const result = await this.cardService.getUserInfo(req.user.id);

    return result;
  }

  // 카드 등록
  @UseInterceptors(CheckFashionMbti, FileInterceptor('fashion_card'))
  @UseGuards(AuthGuard)
  @Post('')
  async createFashionCard(
    @Req() req: UserReq,
    @UploadedFile(new FileValidationPipe(true)) cardImg: Express.Multer.File,
  ): Promise<{ success: boolean }> {
    await this.cardService.createFashionCard(req.user.id, cardImg);

    return { success: true };
  }
}
