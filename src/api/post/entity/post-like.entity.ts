import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Post } from "./post.entity";

export type PostLikeDocument =  PostLike&Document
@Schema({timestamps:true})
export class PostLike{
    @Prop({ref:'User',required:true,type:Types.ObjectId})
    userId:Types.ObjectId
    @Prop({ref:Post.name, required:true,type:Types.ObjectId})
    postId:Types.ObjectId
}

export const PostLikeSchema = SchemaFactory.createForClass(PostLike)