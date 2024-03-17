import { Module } from '@nestjs/common';
import { MyPageController } from './my-page.controller';
import { MyPageService } from './my-page.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [MyPageController],
  providers: [MyPageService],
})
export class MyPageModule {}
