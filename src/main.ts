import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의된 속성 외 제외
      forbidNonWhitelisted: true, // 정의되지 않은 속성 에러 발생
      stopAtFirstError: true, // 첫 번째 에러 사항만 취급
      transform: false, // 형 변환
    }),
  );

  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT');

  await app.listen(PORT, () => {
    console.log(`Listening on Port: ${PORT}`);
  });
}
bootstrap();
