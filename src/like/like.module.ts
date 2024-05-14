import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { DbModule } from '../db/db.module';
import { LikeController } from './like.controller';

@Module({
  imports: [DbModule],
  providers: [LikeService],
  exports: [LikeService],
  controllers: [LikeController],
})
export class LikeModule {}
