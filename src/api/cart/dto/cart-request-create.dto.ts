import { IsMongoId, IsNotEmpty, IsNumber, Min } from "class-validator"

export class CartRequestCreateDto {
    @IsMongoId()
    @IsNotEmpty()
    productVariantId: string
    @IsNumber()
    @Min(1)
    quantity: number
}