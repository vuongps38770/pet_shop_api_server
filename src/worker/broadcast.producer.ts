import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BroadcastProducer {
  constructor(
    @InjectQueue('broadcast-queue') private queue: Queue
  ) {}

  async scheduleBroadcast(payload: any, notificationId: string, scheduledTime: Date) {
    await this.queue.add(
      'send-broadcast',
      { payload, notificationId },
      {
        delay: new Date(scheduledTime).getTime() - Date.now(), 
        attempts: 3,
        removeOnComplete: true,
      }
    );
  }
}
