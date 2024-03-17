import { Module } from '@nestjs/common';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [DbModule, S3Module],
  providers: [RelationService],
  controllers: [RelationController],
})
export class RelationModule {}
