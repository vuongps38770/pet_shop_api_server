import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoucherDocument = Voucher & Document;

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum VoucherApplyType {
  ORDER = 'order',
  PRODUCT = 'product',
}

export enum VoucherErrorCode {
  NOT_FOUND = 'VOUCHER_NOT_FOUND',
  INACTIVE = 'VOUCHER_INACTIVE',
  NOT_STARTED = 'VOUCHER_NOT_STARTED',
  EXPIRED = 'VOUCHER_EXPIRED',
  OUT_OF_QUANTITY = 'VOUCHER_OUT_OF_QUANTITY',
  MIN_ORDER_NOT_MET = 'VOUCHER_MIN_ORDER_NOT_MET',
  MAX_ORDER_EXCEEDED = 'VOUCHER_MAX_ORDER_EXCEEDED',
  NO_PRODUCT_APPLY = 'VOUCHER_NO_PRODUCT_APPLY',
  NO_VALID_PRODUCT = 'VOUCHER_NO_VALID_PRODUCT',
  ALREADY_USED = 'VOUCHER_ALREADY_USED',
  NOT_ELIGIBLE = 'VOUCHER_NOT_ELIGIBLE',
  FIXED_OVER_PRODUCT_PRICE = 'VOUCHER_FIXED_OVER_PRODUCT_PRICE',
  PERCENT_OVER_LIMIT = 'VOUCHER_PERCENT_OVER_LIMIT',
}

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String, enum: DiscountType, required: true })
  discount_type: DiscountType;

  @Prop({ type: Number, required: true })
  discount_value: number;

  @Prop({ type: Number })
  max_discount?: number;

  @Prop({ type: Number, required: true })
  min_order_value: number;

  @Prop({ type: Number })
  max_order_value?: number;

  @Prop({ type: Date, required: true })
  start_date: Date;

  @Prop({ type: Date, required: true })
  end_date: Date;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  used: number;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;

  @Prop({ type: String, enum: VoucherApplyType, required: true })
  apply_type: VoucherApplyType;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  product_ids?: Types.ObjectId[];
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher); 