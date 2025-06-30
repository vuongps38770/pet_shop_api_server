import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


@Schema()
export class Cart {
    @Prop({ required: true })
    userId: string
    @Prop({
        required: true, type: Types.ObjectId, ref: "ProductVariant",
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    productVariantId: Types.ObjectId
    @Prop({ required: true })
    quantity: number
    @Prop({ default: Date.now })
    createdAt: Date
    @Prop({ default: Date.now })
    updatedAt: Date
}
export const CartSchema = SchemaFactory.createForClass(Cart)