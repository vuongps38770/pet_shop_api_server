import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, IsBoolean, IsArray, ValidateIf } from 'class-validator';
import { DiscountType, VoucherApplyType } from '../entity/voucher.entity';
import { Types } from 'mongoose';

export class VoucherCreateDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @IsNumber()
  discount_value: number;

  @IsNumber()
  @IsOptional()
  max_discount?: number;

  @IsNumber()
  min_order_value: number;

  @IsNumber()
  @IsOptional()
  max_order_value?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsNumber()
  quantity: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsEnum(VoucherApplyType)
  apply_type: VoucherApplyType;

  @IsArray()
  @IsOptional()
  @ValidateIf(o => o.apply_type === VoucherApplyType.PRODUCT)
  product_ids?: Types.ObjectId[];

} 