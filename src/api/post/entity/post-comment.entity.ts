import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Post } from "./post.entity";

export type PostCommentDocument = PostComment & Document
@Schema({timestamps:{createdAt:true}})
export class PostComment{
    @Prop({type:Types.ObjectId, required: true, ref:Post.name})
    postId:Types.ObjectId

    @Prop({type:Types.ObjectId, required: true, ref:"User"})
    userId:Types.ObjectId

    @Prop({ref:PostComment.name, default:null, type:Types.ObjectId})
    parent_id:Types.ObjectId|null

    @Prop({ref:PostComment.name})
    root_id:Types.ObjectId

    @Prop({required:true})
    content:string
    @Prop({type:[Types.ObjectId]})
    likeList:Types.ObjectId[]

    @Prop({})
    replyRegex:string
}

export const PostCommentSchema = SchemaFactory.createForClass(PostComment)