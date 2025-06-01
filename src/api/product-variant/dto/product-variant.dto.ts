
import { IsArray, IsNumber, IsString } from "class-validator";
import { Types } from "mongoose";
import { VariantUnit } from "src/api/variant-units/entity/variant-unit";

export class CreateVariantDto {
    variantUnits_ids: string[];
    @IsNumber()
    stock: number;
    @IsString()
    sku?: string;
    @IsNumber()
    importPrice: number
    @IsNumber()
    sellingPrice: number
    @IsNumber()
    promotionalPrice: number
}