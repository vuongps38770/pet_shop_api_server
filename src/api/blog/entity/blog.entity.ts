import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  summary?: string;

  @Prop()
  image?: string;

  @Prop()
  author?: string;

  @Prop({ enum: ['draft', 'published'], default: 'draft' })
  status?: 'draft' | 'published';
  

}

export const BlogSchema = SchemaFactory.createForClass(Blog);
