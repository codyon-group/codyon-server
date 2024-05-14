import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { CommonModule } from './common/common.module';
import { DbModule } from './db/db.module';
import { FilterModule } from './filter/filter.module';
import { LikeModule } from './like/like.module';
import { MailModule } from './mail/mail.module';
import { MyPageModule } from './my-page/my-page.module';
import { S3Module } from './s3/s3.module';
import { UserModule } from './user/user.module';
import { RelationModule } from './relation/relation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    DbModule,
    MailModule,
    CacheModule,
    AuthModule,
    LikeModule,
    FilterModule,
    CommonModule,
    MyPageModule,
    S3Module,
    RelationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
