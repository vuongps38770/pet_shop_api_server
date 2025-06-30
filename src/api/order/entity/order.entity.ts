import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderAddress } from './order-addres.entity';
import { OrderStatus } from '../models/order-status';
import { PaymentType } from '../models/payment-type';

@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({
        required: true, ref: "User",
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    userID: string;

    @Prop({ required: true })
    orderDetailIds: Types.ObjectId[];

    @Prop({ required: true })
    shippingAddress: OrderAddress;

    @Prop({ required: true })
    productPrice: number;

    @Prop({ required: true })
    shippingFee: number;

    @Prop({ required: true })
    totalPrice: number;

    @Prop({ type: String, enum: PaymentType, required: true })
    paymentType: PaymentType;

    @Prop({
        type: [Types.ObjectId], ref: "Payment",
        set: (value: any[]) => {
            return Array.isArray(value)
                ? value.map(v => typeof v === 'string' ? new Types.ObjectId(v) : v)
                : value;
        }
    })
    paymentIds: Types.ObjectId[]

    @Prop({ type: String, enum: OrderStatus, required: true })
    status: OrderStatus;

    @Prop()
    voucherID?: Types.ObjectId;

    @Prop()
    expiredPaymentDate?: Date;

    @Prop({ required: true })
    sku: string;

}

export const OrderSchema = SchemaFactory.createForClass(Order);