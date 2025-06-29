import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RedisService } from '../redis/redis.service';
import { FcmTokenService } from '../api/fcm-token/fcm-token.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const redisService = app.get(RedisService);
  const fcmService = app.get(FcmTokenService);
  const firebase = app.get(FirebaseAdminService);

  console.log('Worker listening on Redis queue...');
  console.log(
`┈┈┈┈▕▔╱▔▔▔━▁
┈┈┈▕▔╱╱╱👁┈╲▂▔▔╲
┈┈▕▔╱╱╱╱💧▂▂▂▂▂▂▏
┈▕▔╱▕▕╱╱╱┈▽▽▽▽▽
▕▔╱┊┈╲╲╲╲▂△△△△
▔╱┊┈╱▕╲▂▂▂▂▂▂╱
╱┊┈╱┉▕┉┋╲┈`)
  while (true) {
    const job = await redisService.popFromQueue('broadcast-queue');
    if (!job) continue;

    const { payload } = job;

    const tokens = await fcmService.getAllFcmtokenFromAllUser();

    if (tokens.length) {
      await firebase.sendNotificationToTokens(tokens, payload);
      console.log('Sent FCM to', tokens.length, 'users');
    } else {
      console.warn(' No FCM tokens found');
    }
  }
  
}

bootstrap();
