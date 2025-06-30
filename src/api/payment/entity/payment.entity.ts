import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentPurpose } from '../models/payment-purpose.enum';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({
    type: Types.ObjectId, required: true, ref: 'Order',
    set: (value: any) => {
      if (typeof value === 'string') {
        return new Types.ObjectId(value);
      }
      return value;
    }
  })
  orderId: Types.ObjectId;

  @Prop({ required: true, enum: PaymentPurpose })
  paymentPurpose: PaymentPurpose

  @Prop({
    type: Types.ObjectId, ref: 'User',
    set: (value: any) => {
      if (typeof value === 'string') {
        return new Types.ObjectId(value);
      }
      return value;
    }
  })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  provider: 'ZALOPAY' | 'VNPAY' | 'MOMO';

  @Prop({ required: true })
  gateway_code?: string;

  @Prop({ required: true })
  transactionId: string;

  @Prop({})
  amount: number;

  @Prop({})
  discount_amount: number;

  @Prop({ required: true, enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'], default: 'PENDING' })
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

  @Prop()
  paymentMethod?: string;

  @Prop()
  expiredAt?: Date;

  @Prop({ type: Object })
  rawRequest?: any;

  @Prop({ type: Object })
  rawResponse?: any;

  @Prop()
  callbackTime?: Date;

  @Prop({ type: Object })
  callbackData?: any;

  @Prop({ type: Object })
  refundInfo?: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
