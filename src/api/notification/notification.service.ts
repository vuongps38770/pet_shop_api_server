import { Injectable } from '@nestjs/common';
import { FcmTokenService } from '../fcm-token/fcm-token.service';
import { FirebaseAdminService } from 'src/firebase-admin/firebase-admin.service';
import { messaging } from 'firebase-admin';
import { log } from 'console';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Notification } from './emtity/notification.entity';
import { CreateNotificationDto, GetUserNotificationDto } from './dto/notification.req.dto';
import { NotificationRead } from './emtity/notification-read.entity';
import { RedisService } from 'src/redis/redis.service';
import { RedisQueueName } from 'src/redis/constants/redis-queue.constant';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AppException } from 'src/common/exeptions/app.exeption';
import { UsersService } from '../users/users.service';
import { MessagingPayload } from 'firebase-admin/lib/messaging/messaging-api';

// Interface cho data thông báo
export interface NotificationData {
    route: string;
    orderId?: string;
    [key: string]: string | undefined;
}

// Interface cho thông báo gửi cho user
export interface SendUserNotificationDto {
    userId: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system' | string;
    data: NotificationData;
    icon?: string;
    image_url?: string;
}

@Injectable()
export class NotificationService {
    constructor(
        private readonly fcmService: FcmTokenService,
        private readonly firebaseAdminService: FirebaseAdminService,
        @InjectModel('Notification') private readonly notificationModel: Model<Notification>,
        private readonly redisService: RedisService,
        @InjectModel(NotificationRead.name)
        private readonly notificationReadModel: Model<NotificationRead>,
        private readonly loudinaryService: CloudinaryService,
        private readonly usersService: UsersService,
        @InjectConnection() private readonly connection: Connection
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



    // async sendToUser(dto: CreateNotificationDto, userId: Types.ObjectId) {
    //     const session = await this.connection.startSession();
    //     session.startTransaction();

    //     try {
    //         const tokens = await this.fcmService.getAllFcmtokenFromUser(userId.toString());

    //         const payload: MessagingPayload = {
    //             data: { type: dto.type },
    //             notification: {
    //                 title: dto.title,
    //                 body: dto.message
    //             }
    //         };

    //         // Gửi notification
    //         await this.firebaseAdminService.sendNotificationToTokens(tokens, payload);

    //         // Lưu notification vào DB
    //         await this.saveNotificationWithSession({
    //             ...dto,
    //             isBroadcast: false,
    //             userId: userId,
    //         }, 'PENDING', session); 

    //         await session.commitTransaction();
    //     } catch (error) {
    //         await session.abortTransaction();
    //         throw error;
    //     } finally {
    //         session.endSession();
    //     }
    // }




    async saveNotification(dto: CreateNotificationDto, status: "PENDING" | "SENT" | "CANCELED") {
        return this.notificationModel.create({ ...dto, status })
    }
    async saveNotificationWithSession(dto: CreateNotificationDto, status: "PENDING" | "SENT" | "CANCELED", session: ClientSession) {
        return this.notificationModel.create({ ...dto, status }, { session })
    }

    async getByUser(userId: string, query: GetUserNotificationDto) {
        const page = parseInt(query?.page ?? '1') || 1;
        const limit = parseInt(query?.limit ?? '20') || 20;
        const skip = (page - 1) * limit;
        const user = await this.usersService.getUserInfoById(userId)

        const filter: any = {
            $and: [
                {
                    $or: [
                        { userId: new Types.ObjectId(userId) },
                        { isBroadcast: true, status: 'SENT' }
                    ]
                },
                {
                    createdAt: { $gte: user.createdAt }
                }
            ]
        };

        if (query.type) {
            filter.$and.push({ type: query.type });
        }

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
            _id: { $in: notificationIds.map((item)=>new Types.ObjectId(item)) }
        });
        log(notis)
        const writes: Promise<any>[] = [];

        for (const noti of notis) {
            if (noti.isBroadcast) {
                // broadcast → thêm vào bảng phụ
                writes.push(
                    this.notificationReadModel.updateOne(
                        { userId: new Types.ObjectId(userId), notificationId: noti._id },
                        { $setOnInsert: { userId: new Types.ObjectId(userId), notificationId: noti._id } },
                        { upsert: true }
                    )
                );
            } else {
                // cá nhân → update trực tiếp
                writes.push(
                    this.notificationModel.updateOne(
                        { _id: noti._id, userId: new Types.ObjectId(userId) },
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

    /**
     * Gửi thông báo cho user cụ thể
     * @param dto Thông tin thông báo
     * @returns Promise<Notification>
     */
    async sendUserNotification(dto: SendUserNotificationDto): Promise<Notification> {
        try {
            // Lưu thông báo vào database
            const notification = await this.saveNotification({
                userId: dto.userId,
                title: dto.title,
                message: dto.message,
                type: dto.type,
                data: dto.data,
                image_url: dto.image_url || '',
                isBroadcast: false,
                isRead: false
            }, 'SENT');

            // Lấy FCM token của user
            const userFcmTokens = await this.fcmService.getAllFcmtokenFromUser(dto.userId);
            console.log(userFcmTokens);

            if (userFcmTokens && userFcmTokens.length > 0) {
                // Tạo payload cho Firebase
                const fcmPayload: messaging.MessagingPayload = {
                    notification: {
                        title: dto.title,
                        body: dto.message,
                        image: dto.image_url
                    },
                    data: {
                        type: dto.type,
                        orderId: dto.data.orderId || '',
                        notificationId: notification._id.toString(),
                        ...dto.data // Thêm tất cả data khác (bao gồm route)
                    }
                };
                console.log(fcmPayload.data);

                // Gửi thông báo qua Firebase
                await this.firebaseAdminService.sendNotificationToTokens(userFcmTokens, fcmPayload);

                log(`✅ Đã gửi thông báo cho user ${dto.userId}: ${dto.title}`);
            } else {
                log(`⚠️ User ${dto.userId} không có FCM token, chỉ lưu thông báo vào database`);
            }

            return notification;
        } catch (error) {
            log(`❌ Lỗi khi gửi thông báo cho user ${dto.userId}:`, error);
            throw new AppException('Không thể gửi thông báo cho user', 500);
        }
    }

    /**
     * Gửi thông báo đơn hàng cho user
     * @param userId ID của user
     * @param orderId ID của đơn hàng
     * @param orderStatus Trạng thái đơn hàng
     * @param additionalData Dữ liệu bổ sung
     */
    async sendOrderNotification(
        userId: string,
        orderId: string,
        orderStatus: string,
        additionalData?: Record<string, string>
    ): Promise<Notification | void> {
        const statusMessages = {
            'PENDING': 'Đơn hàng của bạn đã được đặt thành công',
            'CONFIRMED': 'Đơn hàng của bạn đã được xác nhận',
            'PROCESSING': 'Đơn hàng của bạn đang được xử lý',
            'SHIPPING': 'Đơn hàng của bạn đang được giao',
            'DELIVERED': 'Đơn hàng của bạn đã được giao thành công',
            'CANCELLED': 'Đơn hàng của bạn đã bị hủy',
            'REFUNDED': 'Đơn hàng của bạn đã được hoàn tiền',
            'PAYMENT_SUCCESSFUL': 'Bạn đã thanh toán thành công đơn hàng',
            'SHIPPED': 'Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển'
        };

        const message = statusMessages[orderStatus];
        if (!message) {
            return
        }
        return this.sendUserNotification({
            userId,
            title: 'Cập nhật đơn hàng',
            message,
            type: 'order',
            data: {
                route: '/orders',
                orderId,
                orderStatus,
                ...additionalData
            },
        });
    }

    /**
     * Gửi thông báo khuyến mãi cho user
     * @param userId ID của user
     * @param promoTitle Tiêu đề khuyến mãi
     * @param promoMessage Nội dung khuyến mãi
     * @param promoId ID khuyến mãi (nếu có)
     */
    async sendPromoNotification(
        userId: string,
        promoTitle: string,
        promoMessage: string,
        promoId?: string
    ): Promise<Notification> {
        return this.sendUserNotification({
            userId,
            title: promoTitle,
            message: promoMessage,
            type: 'promo',
            data: {
                route: '/promotions',
                promoId,
                promoTitle
            },
        });
    }

    /**
     * Gửi thông báo hệ thống cho user
     * @param userId ID của user
     * @param title Tiêu đề thông báo
     * @param message Nội dung thông báo
     * @param route Route điều hướng
     */
    async sendSystemNotification(
        userId: string,
        title: string,
        message: string,
        route: string = '/notifications'
    ): Promise<Notification> {
        return this.sendUserNotification({
            userId,
            title,
            message,
            type: 'system',
            data: {
                route
            },
        });
    }
}
