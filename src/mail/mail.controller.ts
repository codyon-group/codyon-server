import { Body, Controller, Post } from '@nestjs/common';
import dayjs, { Dayjs } from 'dayjs';
import { ResendMail } from './dto/resend-mail.dto';
import { SendMail } from './dto/send-mail.dto';
import { validateMail } from './dto/validate-mail.dto';
import { MailService } from './mail.service';

@Controller('api/mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('send/sign-up/code')
  async sendSingUpAuthMail(
    @Body() data: SendMail,
  ): Promise<{ session_id: string; expire_time: Dayjs }> {
    const sessionId = await this.mailService.sendSingUpAuthMail(data.email);

    return { session_id: sessionId, expire_time: dayjs().add(3 * 60, 'seconds') };
  }

  @Post('resend/sign-up/code')
  async resendSignUpAuthMail(@Body() data: ResendMail): Promise<{ expire_time: Dayjs }> {
    await this.mailService.resendSignUpAuthMail(data.session_id);

    return { expire_time: dayjs().add(3 * 60, 'seconds') };
  }

  @Post('validate/sign-up/code')
  async validateSignUpCode(@Body() data: validateMail): Promise<{ success: boolean }> {
    const result = await this.mailService.validateSignUpAuthMail(data.session_id, data.code);

    return { success: result };
  }
}
