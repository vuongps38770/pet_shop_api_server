import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Otp {
    @Prop()
    phone: string;
    @Prop()
    email: string;
    @Prop({ required: true })
    otp: string;
    @Prop({type: Date, default: Date.now})
    createdAt: Date;
    @Prop({type: Date, default: Date.now})
    updatedAt: Date;
    @Prop({type: Date, default: Date.now})
    expiresAt: Date;
}
export const OtpSchema = SchemaFactory.createForClass(Otp)