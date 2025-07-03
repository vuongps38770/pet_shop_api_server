import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderAction } from '../models/order-action.enum'; 

export class CreateOrderLogDto {
  @IsNotEmpty()
  orderId: string;

  @IsEnum(OrderAction)
  action: OrderAction;

  @IsString()
  @IsNotEmpty()
  performed_by: 'ADMIN' | 'USER' | 'SYSTEM';

  @IsOptional()
  @IsString()
  note?: string;
}
