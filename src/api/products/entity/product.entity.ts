import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Types } from "mongoose";
import { ProductDescription, ProductDescriptionSchema } from "./description.entity";
import { ProductVariant, ProductVariantSchema } from "src/api/product-variant/entity/product-variant.entity";




@Schema()
export class Product{
    @Prop({type:Boolean, default:false})
    isActivate:boolean
    @Prop({type:[Types.ObjectId], ref:'categories'})
    categories_ids:Types.ObjectId[]

    @Prop({type:Types.ObjectId, ref:'suppliers'})
    suppliers_id:Types.ObjectId

    @Prop({type:[ProductDescriptionSchema], default:[]})
    descriptions:ProductDescription[]

    @Prop({unique:true})
    name:string

    @Prop({type:[Types.ObjectId], default:[]})
    variantIds:ProductVariant[]

    @Prop({default:[]})
    images:string[]

    @Prop({type:Date, default:Date.now()})
    createdDate:Date
}

export const ProductSchema = SchemaFactory.createForClass(Product)

