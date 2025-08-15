
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductEmbeddingDocument = ProductEmbedding & Document;

@Schema({ collection: 'product_embedding' }) 
export class ProductEmbedding {
  @Prop({ type: Types.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ type: [Number], required: true }) 
  embedding: number[];

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const ProductEmbeddingSchema = SchemaFactory.createForClass(ProductEmbedding);
