import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { DbModule } from '../db/db.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [DbModule, S3Module],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
