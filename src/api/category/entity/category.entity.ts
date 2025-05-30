import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { CategoryType } from "../models/category-.enum";

@Schema()
export class Category {
    _id: string;
    @Prop({
        default: true,
        validate: {
            validator: function (this: Category) {
                if (this.parentId) return this.isRoot === false;
                return this.isRoot === true;
            },
            message: 'isRoot must be true if parentId is null/undefined; false if parentId exists',
        },
    })
    isRoot: boolean;
    @Prop({
        validate: {
            validator: (value: string) => value.trim().length > 0,
            message: 'Name cannot be empty',
        },
    })
    name: string;
    @Prop({ type: Types.ObjectId, ref: 'category' })
    parentId: Types.ObjectId
    @Prop({
        validate: {
            validator: function (this: Category, value: CategoryType | null) {
                if (this.parentId && value) return false;
                if (!this.parentId && !value) return false;
                return true;
            },
            message: 'If category has a parentId, it must not have CategoryType. If it has no parentId, it must have CategoryType.',
        }
    })
    categoryType?: CategoryType

    @Prop({ type: [{ type: Types.ObjectId, ref: 'category' }] })
    children?: Types.ObjectId[];

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;


    @Prop({ type: Date, default: Date.now })
    updatedAt: Date;
}
export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index(
    { name: 1, categoryType: 1 },
    {
        unique: true,
        partialFilterExpression: { parentId: null },
        name: "unique_name_categoryType_parent"
    }
);

CategorySchema.index(
    { name: 1, parentId: 1 },
    {
        unique: true,
        partialFilterExpression: { isRoot: false },
        name: "unique_name_parentId",
    }
);