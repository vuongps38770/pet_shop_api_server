import { Controller, Post } from '@nestjs/common';
import { AppMailerService } from './mailer.service';

@Controller('mailer')
export class AppMailerController {
  constructor(private readonly mailerService: AppMailerService) {}

  @Post('test')
  async test(){
    await this.mailerService.sendOtpEmail('phu59818@gmail.com',"6969",2)
  }
}
