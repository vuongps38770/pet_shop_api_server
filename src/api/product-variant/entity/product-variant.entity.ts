import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { VariantUnit, VariantUnitSchema } from "src/api/variant-units/entity/variant-unit";

@Schema()
export class ProductVariant {
    _id: string

    @Prop({ type: Types.ObjectId, ref: 'products' })
    product_id: Types.ObjectId

    @Prop({ unique: true })
    sku: string

    @Prop({ type: [Types.ObjectId], ref: 'VariantUnit' })
    variantUnits_ids: Types.ObjectId[]

    @Prop({ type: [VariantUnitSchema], default: [] })
    variantUnits: VariantUnit[]

    @Prop({ default: 0 })
    stock: number

    @Prop({ default: 0 })
    importPrice: number

    @Prop({ default: 0 })
    sellingPrice: number

    @Prop({ default: 0 })
    promotionalPrice: number
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant)
