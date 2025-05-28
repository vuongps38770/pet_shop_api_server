import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Category {
    _id: string;
    @Prop({
        required: true, unique: true,
        validate: {
            validator: (value: string) => value.trim().length > 0,
            message: 'Name cannot be empty',
        },
    })
    name: string;
    @Prop({ required: false })
    description: string;
    @Prop({ type: Date, default: Date.now })
    createdAt: Date;
    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}
export const CategorySchema = SchemaFactory.createForClass(Category);