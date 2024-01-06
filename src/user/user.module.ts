import { Module } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { DbService } from '../db/db.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, DbService, CacheService],
})
export class UserModule {}
