import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationReadDocument = NotificationRead & Document;

@Schema({ timestamps: { createdAt: 'readAt' } })
export class NotificationRead {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const NotificationReadSchema = SchemaFactory.createForClass(NotificationRead);
