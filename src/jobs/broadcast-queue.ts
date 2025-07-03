import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { FcmTokenService } from '../api/fcm-token/fcm-token.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import { NotificationService } from 'src/api/notification/notification.service';
import { Types } from 'mongoose';


@Injectable()
export class BroadcastCronService {
    private readonly logger = new Logger(BroadcastCronService.name);
    private readonly redisForCron: Redis;
    constructor(
        configService: ConfigService,
        private fcmService: FcmTokenService,
        private firebase: FirebaseAdminService,
        private readonly notificationService: NotificationService
    ) {
        this.redisForCron = new Redis(configService.getOrThrow<string>('REDIS_URL'), { tls: {} });
    }


    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleBroadcastQueue() {
        const job = await this.peekFromQueue('broadcast-queue');

        if (!job) {
            this.logger.log('Kiểm tra định kỳ broadcast, không có nội dung')
            return
        };

        const { payload, notificationId } = job;
        if (payload.scheduled_time && new Date(payload.scheduled_time).getTime() > Date.now()) {
            const scheduled = new Date(payload.scheduled_time).getTime();
            const now = Date.now();
            const remainingMs = scheduled - now;
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

            this.logger.log(
                `Kiểm tra định kỳ broadcast, sẽ đẩy thông báo hẹn giờ vào ${new Date(payload.scheduled_time).toISOString()} (còn khoảng ${remainingMinutes} phút)`
            );
            return
        }
        const jobToProcess = await this.popFromQueue('broadcast-queue');
        if (!jobToProcess) return;

        const tokens = await this.fcmService.getAllFcmtokenFromAllUser();
        await this.notificationService.findOneByIdAndUpDateStatus(new Types.ObjectId(notificationId + ""), 'SENT')
        if (tokens.length) {
            await this.firebase.sendNotificationToTokens(tokens, payload);
            this.logger.log(`✅ Sent FCM to ${tokens.length} users`);
        } else {
            this.logger.warn('⚠️ No FCM tokens found');
        }
    }

    async popFromQueue(queue: string, timeout = 2): Promise<any> {
        const res = await this.redisForCron.blpop(queue, timeout);
        if (!res) return null;
        return JSON.parse(res[1]);
    }

    async peekFromQueue(queue: string): Promise<any> {
        const res = await this.redisForCron.lindex(queue, -1);
        if (!res) return null;
        return JSON.parse(res);
    }
}
