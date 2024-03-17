import { Module } from '@nestjs/common';
import { MyPageController } from './my-page.controller';
import { MyPageService } from './my-page.service';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [DbModule, S3Module],
  controllers: [MyPageController],
  providers: [MyPageService],
})
export class MyPageModule {}
