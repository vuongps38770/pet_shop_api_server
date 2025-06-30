import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class Favorite {
    @Prop({
        type: Types.ObjectId, required: true, ref: "User",
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    userId: Types.ObjectId
    @Prop({
        type: Types.ObjectId, required: true, ref: "Product",
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    productId: Types.ObjectId
    @Prop({ type: Date, default: Date.now })
    createdDate: Date
}
export const FavoriteSchema = SchemaFactory.createForClass(Favorite)