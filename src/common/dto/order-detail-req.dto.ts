import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class OrderDetailCreateDto {
    @IsNotEmpty()
    @IsString()
    productId: string;

    @IsOptional()
    @IsString()
    variantId: string;

    @IsNotEmpty()
    @IsString()
    productName: string;

    @IsOptional()
    @IsString()
    variantName?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    sellingPrice: number;

    @IsOptional()
    @IsNumber()
    promotionalPrice: number;
}