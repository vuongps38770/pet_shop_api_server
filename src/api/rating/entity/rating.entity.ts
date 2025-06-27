import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ObjectId } from 'typeorm';



@Schema({ timestamps: true })
export class Review {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ type: String })
    comment: string;
    @Prop({ type: [Types.ObjectId] })
    disLikeList: Types.ObjectId[]
    @Prop({ type: [Types.ObjectId] })
    likeList: Types.ObjectId[]
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ user_id: 1, productId: 1 }, { unique: true });
