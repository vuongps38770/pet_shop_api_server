import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
export enum PostStatus{
    PENDING="PENDING",
    UPLOADED="UPLOADED",
    VERIFIED="VERIFIED",
    REJECTED="REJECTED"
}

export type PostDocument = Post&Document& { _id: Types.ObjectId };
@Schema({timestamps : true})
export class Post {
    @Prop({ref:'User', required:true})
    userId:Types.ObjectId
    @Prop({required:true})
    content:string
    @Prop({enum:PostStatus, default:PostStatus.PENDING})
    status:PostStatus

}

export const PostSchema = SchemaFactory.createForClass(Post)