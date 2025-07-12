import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { CategoryType } from "../models/category-.enum";

@Schema({ timestamps: true })
export class Category {

    @Prop({
        validate: {
            validator: (value: string) => value.trim().length > 0,
            message: 'Name cannot be empty',
        },
    })
    name: string;
    @Prop({
        type: Types.ObjectId, ref: 'category',
        set: (value: any) => {
            if (typeof value === 'string') {
                return new Types.ObjectId(value);
            }
            return value;
        }
    })
    parentId: Types.ObjectId

    @Prop({
        type: [{
            type: Types.ObjectId, ref: 'category',
            set: (value: any) => {
                if (typeof value === 'string') {
                    return new Types.ObjectId(value);
                }
                return value;
            }
        }]
    })
    children?: Types.ObjectId[];

    @Prop()
    icon: string


}
export const CategorySchema = SchemaFactory.createForClass(Category);


CategorySchema.index(
    { name: 1, parentId: 1 },
    {
        unique: true,
        name: "unique_name_parentId",
    }
);