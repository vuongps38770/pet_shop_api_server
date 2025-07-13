import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { ProductDescription, ProductDescriptionSchema } from "./description.entity";




@Schema()
export class Product {

    _id: string
    @Prop({ type: Boolean, default: false })
    isActivate: boolean

    @Prop({
        type: [Types.ObjectId], ref: 'category',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    categories_ids: Types.ObjectId[]

    @Prop({
        type: Types.ObjectId, ref: 'supplier',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    suppliers_id: Types.ObjectId

    @Prop({ type: [ProductDescriptionSchema], default: [] })
    descriptions: ProductDescription[]

    @Prop({ unique: true })
    name: string

    @Prop({
        type: [Types.ObjectId], default: [], ref: "ProductVariant",
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    variantIds: Types.ObjectId[]

    @Prop({ default: [] })
    images: string[]

    @Prop({ type: Date, default: Date.now() })
    createdDate: Date


    @Prop({})
    minPromotionalPrice: number
    @Prop({})
    maxPromotionalPrice: number
    @Prop({})
    minSellingPrice: number
    @Prop({})
    maxSellingPrice: number
}

export const ProductSchema = SchemaFactory.createForClass(Product)

ProductSchema.index({ isActivate: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ suppliers_id: 1 });
ProductSchema.index({ categories_ids: 1 });
ProductSchema.index({ minPromotionalPrice: 1 });
ProductSchema.index({ maxPromotionalPrice: 1 });