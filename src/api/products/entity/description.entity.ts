import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class ProductDescription{
    _id:string
    @Prop()
    title:string
    @Prop()
    content:string
    @Prop()
    index:number
}

export const ProductDescriptionSchema = SchemaFactory.createForClass(ProductDescription)
