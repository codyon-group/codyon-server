import { Controller, Get } from '@nestjs/common';
import { FilterService } from './filter.service';
import { StyleOption } from './type';

@Controller('api/filter')
export class FilterController {
  constructor(private filterService: FilterService) {}

  @Get('style')
  async getStyleFilterOptions(): Promise<{ data: Array<StyleOption> }> {
    const data = await this.filterService.getStyleFilterOption();

    return { data };
  }
}
