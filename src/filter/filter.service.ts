import { Injectable } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { DbService } from '../db/db.service';
import { ErrorHandler } from '../exception/error.exception';
import { ErrorCode } from '../exception/error.type';
import { StyleOption } from './type';

@Injectable()
export class FilterService {
  constructor(
    private dbService: DbService,
    private commonService: CommonService,
  ) {}

  async getStyleFilterOption(): Promise<Array<StyleOption>> {
    try {
      const common = this.commonService;
      const extendedDbservice = this.dbService.$extends({
        result: {
          style: {
            id: {
              needs: { id: true },
              compute(style) {
                return common.encrypt(style.id);
              },
            },
          },
        },
      });

      const result = await extendedDbservice.style.findMany();

      return result;
    } catch (err) {
      console.error(`getStyleFilterOption: ${err.msg}`);
      throw new ErrorHandler(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }
}
