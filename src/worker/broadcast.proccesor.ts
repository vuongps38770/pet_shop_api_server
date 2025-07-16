import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { FcmTokenService } from '../api/fcm-token/fcm-token.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';
import { NotificationService } from '../api/notification/notification.service';
import { Types } from 'mongoose';

@Processor('broadcast-queue')
export class BroadcastProcessor {
  private readonly logger = new Logger(BroadcastProcessor.name);

  constructor(
    private fcmService: FcmTokenService,
    private firebase: FirebaseAdminService,
    private notificationService: NotificationService
  ) {}

  @Process('send-broadcast')
  async handleBroadcast(job: Job<{ payload: any, notificationId: string }>) {
    const { payload, notificationId } = job.data;

    const tokens = await this.fcmService.getAllFcmtokenFromAllUser();
    await this.notificationService.findOneByIdAndUpDateStatus(new Types.ObjectId(notificationId), 'SENT');

    if (tokens.length) {
      await this.firebase.sendNotificationToTokens(tokens, payload);
      this.logger.log(`✅ Sent FCM to ${tokens.length} users`);
    } else {
      this.logger.warn('⚠️ No FCM tokens found');
    }
  }
}
