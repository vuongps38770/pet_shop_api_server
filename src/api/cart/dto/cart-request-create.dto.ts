import { IsMongoId, IsNotEmpty, IsNumber, Min } from "class-validator"

export class CartRequestCreateDto {
    @IsMongoId()
    @IsNotEmpty()
    userId: string
    @IsMongoId()
    @IsNotEmpty()
    productVariantId: string
    @IsNumber()
    @Min(1)
    quantity: number
}