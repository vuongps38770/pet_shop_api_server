import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class VariantGroup{
    _id:string;
    @Prop({required:true})
    name:string
}
export const VariantGroupSchema = SchemaFactory.createForClass(VariantGroup)
