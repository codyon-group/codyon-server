import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorHandler, HttpExceptionFilter, setValidatorError } from './exception/error.exception';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errs): ErrorHandler => {
        // stopAtFirstError 옵션으로 인해 errs[0]에만 error 사항 존재
        const err = errs[0];
        const errOption = err.constraints;
        const { code, detailCode, msg } = setValidatorError(errOption, err.property);

        return new ErrorHandler(code, detailCode, msg);
      },
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
