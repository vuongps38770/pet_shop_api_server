import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockAction } from '../models/stock-action.enum';

@Schema({ timestamps: true })
export class StockHistory extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    productId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
    variantId: Types.ObjectId;

    @Prop({ type: Number, required: true })
    oldStock: number;

    @Prop({ type: Number, required: true })
    newStock: number;
    
    @Prop({ type: String, enum: StockAction, required: true })
    action: StockAction;

    @Prop({ type: String })
    note?: string;

    @Prop({ type: String })
    actionBy?: string;
}

export const StockHistorySchema = SchemaFactory.createForClass(StockHistory);