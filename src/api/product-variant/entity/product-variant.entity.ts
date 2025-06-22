import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { VariantUnit, VariantUnitSchema } from "src/api/variant-units/entity/variant-unit";

@Schema()

export class ProductVariant {
    _id: string

    @Prop({ })
    sku: string

    @Prop({ type: [Types.ObjectId], ref: 'VariantUnit' })
    variantUnits_ids: Types.ObjectId[]


    @Prop({ default: 0 })
    stock: number

    @Prop({ default: 0 })
    importPrice: number

    @Prop({ default: 0 })
    sellingPrice: number

    @Prop({ default: 0 })
    promotionalPrice: number


    @Prop({type:Types.ObjectId, ref:"Product"})
    productId:Types.ObjectId

    @Prop({type:[Types.ObjectId], ref:"StockHistory"})
    logIds:Types.ObjectId[]
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant)


ProductVariantSchema.index(
  { sku: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: {
      sku: { $type: 'string' } 
    }
  }
);