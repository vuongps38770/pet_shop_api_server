import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppMailerService {
    constructor(private readonly mailerService: MailerService) { }

    async sendWelcomeEmail(to: string, name: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Chào mừng bạn đến với PetShop',
                template: 'wellcome', 
                context: {
                    name,
                },
            });
            console.log('✅ Email đã được gửi tới:', to);
        } catch (error) {
            console.error('❌ Gửi email thất bại:', error);
            throw error;
        }
    }

    async sendOtpEmail(to: string, otp: string, expiresInMinutes: number) {
        const currentYear = new Date().getFullYear();
        try {
            await this.mailerService.sendMail({
                to,
                subject: 'Mã xác thực OTP của bạn',
                template: 'otp-mail', 
                context: {
                    otp,
                    expiresInMinutes,
                    currentYear,
                },
            });
            console.log('✅ Email OTP đã được gửi tới:', to);
        } catch (error) {
            console.error('❌ Gửi email OTP thất bại:', error);
            throw error;
        }
    }
}
