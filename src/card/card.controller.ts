import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Redirect,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { UserReq } from '../auth/type';
import { CheckFashionMbti } from '../interceptor/check-fashion-mbti.interceptor';
import { FileValidationPipe } from '../s3/file.validation';
import { CardService } from './card.service';
import { CreateCard } from './dto/create-card.dto';
import { DeleteCard } from './dto/delete-card.dto';
import { CardPagination } from './dto/get-card-history.dto';
import { CardList } from './dto/get-card-list.dto';
import { GetCard } from './dto/get-card.dto';
import { Card, CardDetail, CardUserInfo, Pagination, ResDetailCardInfo } from './type';

@Controller('api/card')
export class CardController {
  private HOST: string;
  private PORT: string;

  constructor(
    private configService: ConfigService,
    private cardService: CardService,
  ) {
    this.HOST = this.configService.get('HOST');
    this.PORT = this.configService.get('PORT');
  }

  // 필터 및 검색어 사용
  @Get()
  async getFashionCardList(
    @Query() data: CardList,
  ): Promise<{ pagination: Pagination; data: Array<Card> }> {
    const result = await this.cardService.getFashionCardList(data);

    if (!result.length) {
      return {
        pagination: { cursor: null, is_end: true },
        data: [],
      };
    }

    const pagination = {
      cursor: result[result.length - 1].id.toString(),
      is_end: result.length < data.limit,
    };

    return { pagination, data: result };
  }

  // my-page에서 조회 가능
  @UseGuards(AuthGuard)
  @Get('history')
  async getFashionCardHistory(
    @Req() req: UserReq,
    @Query() data: CardPagination,
  ): Promise<{ pagination: Pagination; data: Array<CardDetail> }> {
    const result = await this.cardService.getCardHistory(req.user.id, data.limit, data.cursor);

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

    return { pagination, data: result };
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
  @Redirect('')
  async createFashionCard(
    @Req() req: UserReq,
    @UploadedFile(new FileValidationPipe(true)) cardImg: Express.Multer.File,
    @Body() data: CreateCard,
  ): Promise<{ sucees: boolean; url: string }> {
    const cardId = await this.cardService.createFashionCard(req.user.id, cardImg, data.style_tag);

    return {
      sucees: true,
      url: `${this.HOST}:${this.PORT}/api/card/detail?card_id=${cardId}`,
    };
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
