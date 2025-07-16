import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export type ConversationDocument = Conversation & Document<Types.ObjectId>;
@Schema({
    timestamps: true,
})
export class Conversation {
    @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
    participants: Types.ObjectId[];
    @Prop({ required: true })
    type: 'shop' | string
    @Prop({ type: Types.ObjectId, ref: 'Message' })
    lastMessageId: Types.ObjectId;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);