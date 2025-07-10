import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type VoucherUsageDocument = VoucherUsage & Document;

@Schema({ timestamps: false })
export class VoucherUsage {
  @Prop({ type: Types.ObjectId, ref: 'Voucher', required: true })
  voucher_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Date })
  used_at: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order_id?: Types.ObjectId;
}

export const VoucherUserSchema = SchemaFactory.createForClass(VoucherUsage); 