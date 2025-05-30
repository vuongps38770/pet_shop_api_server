import { Prop, Schema } from "@nestjs/mongoose";


@Schema()
export class Cart{
    @Prop({required:true})
    userId:string
    @Prop({required:true})
    productVariantId:string
    @Prop({required:true})
    quantity:number
}