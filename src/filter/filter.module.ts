import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DbModule } from '../db/db.module';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';

@Module({
  imports: [DbModule, CommonModule],
  controllers: [FilterController],
  providers: [FilterService],
})
export class FilterModule {}
