import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { DbModule } from '../db/db.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DbModule, CacheModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
