import { Module } from '@nestjs/common';
import { AppMailerService } from './mailer.service';
import { AppMailerController } from './app-mailer.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

const templatesPath = path.resolve(process.cwd(), 'src', 'templates');
console.log('Đường dẫn templates được tạo:', templatesPath);
@Module({
  controllers: [AppMailerController],
  providers: [AppMailerService],
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'vuongdtqps38770@gmail.com',
          pass: 'amww otlj stma zktb',
        },
      },
      defaults: {
        from: '"PetShop" <vuongdqps38770@gmail.com>',
      },
      template: {
        dir: templatesPath,
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  exports:[AppMailerService]
})
export class AppMailerModule { }
