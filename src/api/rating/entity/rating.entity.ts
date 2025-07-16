import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ObjectId } from 'typeorm';



@Schema({ timestamps: true })
export class Review {
    @Prop({
        type: Types.ObjectId, ref: 'User', required: true,
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    user_id: Types.ObjectId;

    @Prop({
        type: Types.ObjectId, ref: 'Product', required: true,
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    productId: Types.ObjectId;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ type: String })
    comment: string;
    @Prop({
        type: [Types.ObjectId],
        set: (value: any[]) => {
            return Array.isArray(value)
                ? value.map(v => typeof v === 'string' ? new Types.ObjectId(v) : v)
                : value;
        }
    })
    disLikeList: Types.ObjectId[]
    @Prop({
        type: [Types.ObjectId],
        set: (value: any[]) => {
            return Array.isArray(value)
                ? value.map(v => typeof v === 'string' ? new Types.ObjectId(v) : v)
                : value;
        }
    })
    likeList: Types.ObjectId[]
    @Prop()
    images: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ user_id: 1, productId: 1 }, { unique: true });
