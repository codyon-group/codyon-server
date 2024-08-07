import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CacheModule } from '../cache/cache.module';
import { DbModule } from '../db/db.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DbModule, CacheModule, CommonModule],
  controllers: [UserController],
  providers: [UserService, AuthService],
})
export class UserModule {}
