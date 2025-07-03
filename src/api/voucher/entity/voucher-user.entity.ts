import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoucherUserDocument = VoucherUser & Document;

@Schema({ timestamps: false })
export class VoucherUser {
  @Prop({ type: Types.ObjectId, ref: 'Voucher', required: true })
  voucher_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Date, required: true })
  used_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id?: Types.ObjectId;
}

export const VoucherUserSchema = SchemaFactory.createForClass(VoucherUser); 