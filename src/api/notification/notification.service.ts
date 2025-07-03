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
import { AppException } from 'src/common/exeptions/app.exeption';

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
    private assertISODateString(value: string): void {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
        const isValid = isoRegex.test(value) && !isNaN(Date.parse(value));

        if (!isValid) {
            throw new Error('scheduled_time must be in ISO 8601 format (e.g. 2025-07-02T14:30:00Z)');
        }
    }
    async adminBroadcast(dto: CreateNotificationDto, image: Express.Multer.File) {
        try {
            if (dto.scheduled_time) {
                this.assertISODateString(dto.scheduled_time)
            }
        } catch (error) {
            throw new AppException('date have to format (iso)')
        }
        log(dto)
        let imgUrl: string = '';
        if (image) {
            imgUrl = await this.loudinaryService.uploadImage(image);
        }
        log(imgUrl)

        const scheduledDate = dto.scheduled_time
            ? new Date(dto.scheduled_time).toISOString()
            : undefined;

        const saved = await this.saveNotification({
            ...dto,
            scheduled_time: scheduledDate,
            isBroadcast: true,
            userId: undefined,
            image_url: imgUrl,

        }, 'PENDING');


        const fcmPayload = {
            scheduled_time: dto.scheduled_time,
            notification: {
                title: dto.title,
                body: dto.message,
                image: imgUrl
            },
            data: { type: dto.type },
        };

        await this.redisService.pushToQueue(RedisQueueName.BROADCAST_QUEUE, {
            notificationId: saved._id,
            payload: fcmPayload,
        });
    }








    async saveNotification(dto: CreateNotificationDto, status: "PENDING" | "SENT" | "CANCELED") {
        return this.notificationModel.create({ ...dto, status })
    }
    async getByUser(userId: string, query: GetUserNotificationDto) {
        const page = parseInt(query?.page ?? '1') || 1;
        const limit = parseInt(query?.limit ?? '20') || 20;
        const skip = (page - 1) * limit;

        const filter = {
            $or: [
                { userId: new Types.ObjectId(userId) },
                { isBroadcast: true, status: 'SENT' }
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

    async findOneByIdAndUpDateStatus(notificationId: Types.ObjectId, status: "PENDING" | "SENT" | "CANCELED") {
        await this.notificationModel.findOneAndUpdate(notificationId, { status: status })
    }
    async findAllForAdmin(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.notificationModel
                .find({ isBroadcast: true })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            this.notificationModel.countDocuments({ isBroadcast: true }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }
}
