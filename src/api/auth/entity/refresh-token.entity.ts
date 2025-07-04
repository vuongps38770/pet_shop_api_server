import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserRole } from "../models/role.enum";


@Schema()
export class RefreshToken {
    @Prop({ required: true })
    userId: string;
    @Prop({ required: true })
    hashedToken: string;
    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
    @Prop({ type: Date, required: true })
    expiresAt: Date;
    @Prop({ })
    ipAddress: string;
    @Prop({ required: true })
    userAgent: string;
    @Prop()
    fcmToken:string
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);