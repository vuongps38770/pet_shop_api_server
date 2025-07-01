import { Injectable } from '@nestjs/common';
import { FcmTokenService } from '../fcm-token/fcm-token.service';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { messaging } from 'firebase-admin';
import { log } from 'console';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './emtity/notification.entity';
import { CreateNotificationDto, GetUserNotificationDto } from './dto/notification.req.dto';
import { NotificationRead } from './emtity/notification-read.entity';
import { RedisService } from 'src/redis/redis.service';
import { RedisQueueName } from 'src/redis/constants/redis-queue.constant';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class NotificationService {
    constructor(
        private readonly fcmService: FcmTokenService,
        private readonly firebaseAdminService: FirebaseAdminService,
        @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
        private readonly redisService: RedisService,
        @InjectModel(NotificationRead.name)
        private readonly notificationReadModel: Model<NotificationRead>,
        private readonly loudinaryService: CloudinaryService
    ) { }

    //test
    async adminSendNotifiToAllUser(payload: messaging.MessagingPayload) {
        const targetList = await this.fcmService.getAllFcmtokenFromAllUser()
        log("targetList", targetList)
        await this.firebaseAdminService.sendNotificationToTokens(targetList, payload)
    }

    async adminBroadcast(dto: CreateNotificationDto,image:Express.Multer.File) {
        log(dto)
        let imgUrl: string = '';
        if (image) {
            imgUrl = await this.loudinaryService.uploadImage(image);
        }
        log(imgUrl)
        const saved = await this.saveNotification({
            ...dto,
            isBroadcast: true,
            userId: undefined,
            image_url: imgUrl,
        });

        
        const fcmPayload = {
            notification: {
                title: dto.title,
                body: dto.message,
                image:imgUrl
            },
            data: {type:dto.type},
        };

        await this.redisService.pushToQueue(RedisQueueName.BROADCAST_QUEUE, {
            notificationId: saved._id,
            payload: fcmPayload,
        });
    }








    async saveNotification(dto: CreateNotificationDto) {
        return this.notificationModel.create(dto)
    }
    async getByUser(userId: string, query: GetUserNotificationDto) {
        const page = parseInt(query?.page ?? '1') || 1;
        const limit = parseInt(query?.limit ?? '20') || 20;
        const skip = (page - 1) * limit;

        const filter = {
            $or: [
                { userId: new Types.ObjectId(userId) },
                { isBroadcast: true }
            ]
        };

        const [notifications, total, readList] = await Promise.all([
            this.notificationModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.notificationModel.countDocuments(filter),
            this.notificationReadModel.find({ userId }).lean()
        ]);

        const readMap = new Set(readList.map((r) => r.notificationId.toString()));

        const data = notifications.map((noti) => ({
            ...noti,
            isRead: !noti.isBroadcast
                ? noti.isRead
                : readMap.has(noti._id.toString())
        }));

        return {
            data,
            pagination: {
                page,
                limit,
                total
            }
        };
    }


    async markAsRead(notificationIds: string[], userId: string) {
        const notis = await this.notificationModel.find({
            _id: { $in: notificationIds }
        });

        const writes: Promise<any>[] = [];

        for (const noti of notis) {
            if (noti.isBroadcast) {
                // broadcast → thêm vào bảng phụ
                writes.push(
                    this.notificationReadModel.updateOne(
                        { userId, notificationId: noti._id },
                        { $setOnInsert: { userId, notificationId: noti._id } },
                        { upsert: true }
                    )
                );
            } else {
                // cá nhân → update trực tiếp
                writes.push(
                    this.notificationModel.updateOne(
                        { _id: noti._id, userId },
                        { $set: { isRead: true } }
                    )
                );
            }
        }

        await Promise.all(writes);
        return { success: true };
    }
}
