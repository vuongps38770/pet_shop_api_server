import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { FcmTokenService } from '../api/fcm-token/fcm-token.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';

@Injectable()
export class BroadcastCronService {
    private readonly logger = new Logger(BroadcastCronService.name);
    private readonly redisForCron: Redis;
    constructor(
        configService: ConfigService,
        private fcmService: FcmTokenService,
        private firebase: FirebaseAdminService,
    ) {
        this.redisForCron = new Redis(configService.getOrThrow<string>('REDIS_URL'), { tls: {} });
    }


    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleBroadcastQueue() {
        const job = await this.popFromQueue('broadcast-queue');
        log(job)
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
    
    async popFromQueue(queue: string, timeout = 2): Promise<any> {
        const res = await this.redisForCron.blpop(queue, timeout);
        if (!res) return null;
        return JSON.parse(res[1]);
    }
}
