import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, SchemaType, SchemaTypes } from "mongoose";
import { UserRole } from "./role.enum";
export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    _id: string;
    @Prop({ })
    password: string;
    @Prop({ required: false })
    surName: string;
    @Prop({ required: true })
    name: string;
    @Prop({unique:true})
    phone: string;
    @Prop({unique:true})
    email: string;
    @Prop({ type: Date, default: Date.now })
    lastLogin: Date;
    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
    @Prop({enum:UserRole, default:UserRole.USER})
    role: UserRole;


}
export const UserSchema = SchemaFactory.createForClass(User);


