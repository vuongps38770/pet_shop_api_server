import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsMongoId, IsDate, IsBoolean } from 'class-validator';

export enum PaymentProvider {
    ZALOPAY = 'ZALOPAY',
    VNPAY = 'VNPAY',
    MOMO = 'MOMO'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED'
}

export class CreatePaymentReqDto {
    @IsNotEmpty()
    @IsMongoId()
    orderId: string;

    @IsOptional()
    @IsMongoId()
    userId?: string;

    @IsNotEmpty()
    @IsEnum(PaymentProvider)
    provider: PaymentProvider;

    @IsNotEmpty()
    @IsString()
    gateway_code?: string;

    @IsOptional()
    @IsString()
    transactionId: string;

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsDate()
    expiredAt?: Date;

    @IsOptional()
    rawRequest?: any;

    @IsOptional()
    rawResponse?: any;

    @IsOptional()
    @IsDate()
    callbackTime?: Date;

    @IsOptional()
    callbackData?: any;

    @IsOptional()
    @IsBoolean()
    isRefunded?: boolean;

    @IsOptional()
    refundInfo?: any;
}