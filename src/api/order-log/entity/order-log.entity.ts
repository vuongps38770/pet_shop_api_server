import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
    ordeId: Types.ObjectId;

    @Prop({ required: true })
    action: string;

    @Prop({ required: true })
    performed_by: 'ADMIN' | 'USER';

    @Prop()
    note?: string;
}

export const OrderLogSchema = SchemaFactory.createForClass(OrderLog);
