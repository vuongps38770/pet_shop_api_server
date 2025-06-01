import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {Types } from "mongoose";
import { ProductDescription, ProductDescriptionSchema } from "./description.entity";




@Schema()
export class Product{
    @Prop({type:[Types.ObjectId], ref:'VariantGroup'})
    variantGroupIds:Types.ObjectId[]

    @Prop({type:Boolean, default:false})
    isActivate:boolean

    @Prop({type:[Types.ObjectId], ref:'category'})
    categories_ids:Types.ObjectId[]
    
    @Prop({type:Types.ObjectId, ref:'supplier'})
    suppliers_id:Types.ObjectId

    @Prop({type:[ProductDescriptionSchema], default:[]})
    descriptions:ProductDescription[]

    @Prop({unique:true})
    name:string

    @Prop({type:[Types.ObjectId], default:[],ref:"ProductVariant" })
    variantIds:Types.ObjectId[]

    @Prop({default:[]})
    images:string[]

    @Prop({type:Date, default:Date.now()})
    createdDate:Date


    @Prop({})
    minPromotionalPrice:number
    @Prop({})
    maxPromotionalPrice:number
    @Prop({})
    minSellingPrice:number
    @Prop({})
    maxSellingPrice:number
}

export const ProductSchema = SchemaFactory.createForClass(Product)

