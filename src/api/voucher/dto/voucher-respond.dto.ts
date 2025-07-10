import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class VoucherRespondDto {
  @ApiProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  discount_type: string;

  @ApiProperty()
  discount_value: number;

  @ApiProperty({ required: false })
  max_discount?: number;

  @ApiProperty()
  min_order_value: number;

  @ApiProperty()
  start_date: Date;

  @ApiProperty()
  end_date: Date;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  used: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  apply_type: string;

  @ApiProperty({ required: false, type: [String] })
  product_ids?: string[];

  @ApiProperty({ required: false })
  status?: 'not_collected' | 'collected_unused' | 'collected_used' | 'expired_unused';
}

export class VoucherQueryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, enum: ['not_collected', 'collected_unused', 'collected_used', 'expired_unused'] })
  status?: 'not_collected' | 'collected_unused' | 'collected_used' | 'expired_unused';

  @ApiProperty({ required: false, default: 1 })
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  limit?: number = 10;
} 