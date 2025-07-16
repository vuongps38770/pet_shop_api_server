import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({
        type: Types.ObjectId, ref: 'User',
        required: true,
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }else if (value instanceof Types.ObjectId) {
                return value;
            }
        }
    })
    sender: Types.ObjectId;

    @Prop({
        type: Types.ObjectId, ref: 'Conversation',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }else if (value instanceof Types.ObjectId) {
                return value;
            }
        }
    })
    conversationId: Types.ObjectId;

    @Prop({ required: false })
    content: string;
    @Prop({
        type: [Types.ObjectId], ref: 'User',
        set: (value: any) => {
            if (Array.isArray(value)) {
                return value.map((id: any) => {
                    if (typeof id === 'string') {
                        return new Types.ObjectId(id);
                    }else if (id instanceof Types.ObjectId) {
                        return id;
                    }
                    return id;
                });
            }
            return [];
        }
    })
    readList: Types.ObjectId[];

    @Prop({
        type: Types.ObjectId, ref: 'Product',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
        }
    })
    productId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId, ref: 'Order',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
        }
    })
    orderId: Types.ObjectId;

    @Prop({ default: false })
    isEdited: boolean;


    @Prop({ })
    images: string[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);