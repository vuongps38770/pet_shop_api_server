import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderAddress } from './order-addres.entity';
import { OrderStatus } from '../models/order-status';
import { PaymentType } from '../models/payment-type';
import { log } from 'console';



@Schema({
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
})
export class Order {
    @Prop({


        required: true, ref: "User",
        set: (value: any) => {
            console.log(' Setter called for userID:', value);
            if (typeof value === 'string') {
                log("value là string đang cast sang object id")
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    userID: Types.ObjectId;

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

    @Prop()
    discount?: number;

    // Thông tin hoàn tiền
    @Prop({ type: String, enum: ['PENDING', 'REFUNDED', 'FAILED'], default: null })
    refundStatus?: string;

    @Prop()
    refundedAt?: Date;

    @Prop()
    refundAmount?: number;

    @Prop()
    refundError?: string;

}

export const OrderSchema = SchemaFactory.createForClass(Order);
export type OrderDocument = Order & Document<Types.ObjectId>;