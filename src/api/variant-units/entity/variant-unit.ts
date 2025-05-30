import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class VariantUnit{
    _id:string;
    @Prop({required:true})
    name:string
    @Prop({type:Types.ObjectId,ref:"variantgroups"})
    variantGroupId:Types.ObjectId
}   

export const VariantUnitSchema = SchemaFactory.createForClass(VariantUnit)