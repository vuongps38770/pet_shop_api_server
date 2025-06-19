import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { OrderAddress } from "../entity/order-addres.entity";
import { Type } from "class-transformer";
import { OrderStatus } from "../models/order-status";
import { PaymentType } from "../models/payment-type";

export class OrderCreateReqDto {
    @IsNotEmpty()
    shippingAddressId: string;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderReqItem)
    orderItems: OrderReqItem[];

    @IsOptional()
    @IsString()
    voucherCode?: string;

    @IsOptional()
    @IsNumber()
    totalClientPrice?: number;

    @IsNotEmpty()
    @IsIn(Object.values(PaymentType))
    paymentType: PaymentType;

}

export class OrderReqItem {
    @IsNotEmpty()
    @IsString()
    variantId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantity: number;
}

export class OrderListReqDto {
    @IsOptional()
    @IsArray()
    @IsIn(Object.values(OrderStatus), { each: true })
    statuses?: OrderStatus[];

    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsIn(['createdDate', 'totalPrice'])
    sortBy?: 'createdDate' | 'totalPrice' = 'createdDate';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}

export class OrderStatusUpdateDto {
    @IsNotEmpty()
    @IsIn(Object.values(OrderStatus))
    status: OrderStatus;
}

export class OrderAdminListReqDto {
    @IsOptional()
    @IsArray()
    @IsIn(Object.values(OrderStatus), { each: true })
    statuses?: OrderStatus[];

    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsIn(['createdDate', 'totalPrice'])
    sortBy?: 'createdDate' | 'totalPrice' = 'createdDate';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CalculateOrderPriceDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderReqItem)
    orderItems: OrderReqItem[]


    @IsOptional()
    shippingAddressId?: string;

    @IsOptional()
    voucherCode?: string;
}