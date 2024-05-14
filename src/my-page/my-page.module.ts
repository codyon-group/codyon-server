import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';
import { MyPageController } from './my-page.controller';
import { MyPageService } from './my-page.service';

@Module({
  imports: [DbModule, S3Module, CommonModule],
  controllers: [MyPageController],
  providers: [MyPageService],
})
export class MyPageModule {}
