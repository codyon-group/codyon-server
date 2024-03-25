import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
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
import { DeleteCard } from './dto/delete-card.dto';
import { CardUserInfo, Pagination, ResCardHistory, ResDetailCardInfo } from './type';
import { GetCard } from './dto/get-card.dto';
import { CardPagination } from './dto/get-card-history.dto';
import { CARD, S3Service } from '../s3/s3.service';

@Controller('api/card')
export class CardController {
  constructor(
    private cardService: CardService,
    private s3Service: S3Service,
  ) {}

  // my-page에서 조회 가능
  @UseGuards(AuthGuard)
  @Get('/history')
  async getFashionCardHistory(
    @Req() req: UserReq,
    @Query() data: CardPagination,
  ): Promise<{ pagination: Pagination; data: Array<ResCardHistory> }> {
    const result = await this.cardService.getCardHistory(req.user.id, data.cursor, data.limit);

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

    const cardHistory = result.map((x) => {
      return {
        id: x.id,
        card_img: this.s3Service.setObjectKey(CARD, x.img_key),
        created_time: x.created_time,
      };
    });

    return { pagination, data: cardHistory };
  }

  // 카드 상세 조회
  @Get('detail')
  async getFashionCard(@Query() data: GetCard): Promise<ResDetailCardInfo> {
    const result = await this.cardService.getFashionCard(data.card_id);

    return result;
  }

  // 카드 등록 전 사용자 자동 입력값 조회
  @UseInterceptors(CheckFashionMbti)
  @UseGuards(AuthGuard)
  @Get('user-info')
  async getUserInfo(@Req() req: UserReq): Promise<CardUserInfo> {
    const result = await this.cardService.getUserInfo(req.user.id);

    return result;
  }

  // 카드 등록
  @UseInterceptors(CheckFashionMbti, FileInterceptor('card'))
  @UseGuards(AuthGuard)
  @Post('')
  async createFashionCard(
    @Req() req: UserReq,
    @UploadedFile(new FileValidationPipe(true)) cardImg: Express.Multer.File,
  ): Promise<{ success: boolean }> {
    await this.cardService.createFashionCard(req.user.id, cardImg);

    return { success: true };
  }

  // 카드 삭제
  @UseGuards(AuthGuard)
  @Delete('')
  async deleteFashionCard(
    @Req() req: UserReq,
    @Query() data: DeleteCard,
  ): Promise<{ success: boolean }> {
    await this.cardService.deleteFashionCard(req.user.id, data.card_id);

    return { success: true };
  }
}
