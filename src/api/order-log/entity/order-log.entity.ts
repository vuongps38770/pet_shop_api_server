import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderAction } from '../models/order-action.enum';

export type OrderLogDocument = OrderLog & Document;

@Schema({ timestamps: true })
export class OrderLog {
    @Prop({
        required: true, ref: 'Order',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    orderId: Types.ObjectId;

    @Prop({ required: true ,enum:OrderAction})
    action: OrderAction;

    @Prop({ required: true })
    performed_by: 'ADMIN' | 'USER' |'SYSTEM';

    @Prop()
    note?: string;
}

export const OrderLogSchema = SchemaFactory.createForClass(OrderLog);
