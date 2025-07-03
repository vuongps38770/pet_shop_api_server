import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    
    @Prop({
        type: Types.ObjectId, ref: 'User',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    userId?: string;
    @Prop({ default: false })
    isBroadcast: boolean;
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    type: 'order' | 'promo' | 'system' | string;

    @Prop()
    icon?: string;

    @Prop({ type: Object, default: {} })
    data: Record<string, any>;

    @Prop({required:true})
    status:"PENDING"|"SENT"|"CANCELED"

    @Prop({ default: false })
    isRead?: boolean;
    @Prop({})
    image_url: string;
    @Prop({})
    scheduled_time: Date
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
