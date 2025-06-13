import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmpty } from "class-validator";
import { Types } from "mongoose";

@Schema()
export class Address{
  
    @Prop({type:Types.ObjectId, ref:"User"})
    userId:Types.ObjectId
    @Prop()
    province:string
    @Prop()
    district:string
    @Prop()
    ward:string
    @Prop()
    streetAndNumber:string
    @Prop()
    lat:number
    @Prop()
    lng:number
    @Prop()
    receiverFullname:string
    
    @Prop({type:Date,default:Date.now})
    createdDate:Date

    @Prop({type:Boolean,default:false})
    isDefault:boolean

}
export const AddressSchema=SchemaFactory.createForClass(Address)