import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Post } from "./post.entity";
export enum PostMediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}
export type PostMediaDocument = PostMedia & Document
@Schema({timestamps:{createdAt:true}})
export class PostMedia{
    @Prop({type:Types.ObjectId, required: true, ref:Post.name})
    postId:Types.ObjectId

    @Prop({enum:PostMediaType, required:true})
    type: PostMediaType

    @Prop({required:true})
    url:string
}

export const PostMediaSchema = SchemaFactory.createForClass(PostMedia)