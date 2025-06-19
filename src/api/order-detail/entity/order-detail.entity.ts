import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema()
export class OrderDetail {
    @Prop({ type: Types.ObjectId, ref: 'Order' })
    orderId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
    variantId?: Types.ObjectId;

    @Prop()
    productName: string;

    @Prop()
    variantName?: string;

    @Prop()
    image?: string;

    @Prop({ type: Number, required: true })
    quantity: number;

    @Prop({ type: Number, required: true })
    sellingPrice: number;

    @Prop({ type: Number })
    promotionalPrice?: number;
}

export const OrderDetailSchema = SchemaFactory.createForClass(OrderDetail)