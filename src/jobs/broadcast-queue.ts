import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { FcmTokenService } from '../api/fcm-token/fcm-token.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';

@Injectable()
export class BroadcastCronService {
    private readonly logger = new Logger(BroadcastCronService.name);

    constructor(
        private redisService: RedisService,
        private fcmService: FcmTokenService,
        private firebase: FirebaseAdminService,
    ) { }


    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleBroadcastQueue() {
        const job = await this.redisService.popFromQueue('broadcast-queue');
        if (!job) return;

        const { payload } = job;
        const tokens = await this.fcmService.getAllFcmtokenFromAllUser();

        if (tokens.length) {
            await this.firebase.sendNotificationToTokens(tokens, payload);
            this.logger.log(`✅ Sent FCM to ${tokens.length} users`);
        } else {
            this.logger.warn('⚠️ No FCM tokens found');
        }
    }
}
