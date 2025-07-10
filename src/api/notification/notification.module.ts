import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { FcmTokenModule } from '../fcm-token/fcm-token.module';
import { FirebaseAdminModule } from 'src/firebase-admin/firebase-admin.module';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationSchema } from './emtity/notification.entity';
import { NotificationRead, NotificationReadSchema } from './emtity/notification-read.entity';
import { RedisModule } from 'src/redis/redis.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  imports: [
    FcmTokenModule,
    FirebaseAdminModule,
    MongooseModule.forFeature([
      {
        name: 'Notification',
        schema: NotificationSchema
      },
      {
        name: NotificationRead.name,
        schema: NotificationReadSchema
      }
    ]),
    RedisModule,
    CloudinaryModule,
    UsersModule
  ],

  exports: [NotificationService],

})
export class NotificationModule { }
