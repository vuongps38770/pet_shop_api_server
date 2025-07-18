import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, SchemaType, SchemaTypes } from "mongoose";
import { UserRole } from "../models/role.enum";
export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    _id: string;
    @Prop({})
    password: string;
    @Prop({ required: false })
    surName: string;
    @Prop({ required: true })
    name: string;
    @Prop({ })
    phone: string;
    @Prop({  })
    email: string;
    @Prop({ type: Date, default: Date.now })
    lastLogin: Date;
    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
    @Prop({ enum: UserRole, default: UserRole.USER })
    role: UserRole;
    @Prop({ type: SchemaTypes.String, default: "https://res.cloudinary.com/dzuqdrb1e/image/upload/v1739074405/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector_yfnz21.jpg" })
    avatar: string;
    @Prop()
    provider:string

}
export const UserSchema = SchemaFactory.createForClass(User);


UserSchema.index(
    { phone: 1 },
    {
        unique: true,
        partialFilterExpression: {
            phone: { $type: 'string' }
        }
    }
);
UserSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            email: { $type: 'string' }
        }
    }
);