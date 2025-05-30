import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Category } from "./entity/category.entity";
import { Model } from "mongoose";
import { CategoryRequestCreateDto } from "./dto/category.dto";
import { CategoryType } from "./models/category-.enum";

@Injectable()
export class CategoryService implements OnModuleInit {

    constructor(
        @InjectModel('category') private readonly categoryModel: Model<Category>

    ) {

    }
    async onModuleInit() {
        console.log('Syncing indexes for Category collection...');
        await this.categoryModel.syncIndexes();
        console.log('Indexes synced!');
    }
    async addCategory(data: CategoryRequestCreateDto): Promise<Category> {
        const newCategory = await this.categoryModel.create({
            categoryType: data.categoryType || null,
            name: data.name,
            parentId: data.parentId || null,
            isRoot:data.isRoot
        },);
        if (data.parentId) {
            await this.categoryModel.findByIdAndUpdate(
                data.parentId,
                {
                    $push: { children: newCategory._id }

                },
                { new: true,runValidators:true }
            )
        }
        return newCategory

    }

    async getCategoryById(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).exec();
    }
    async getCategoriesByType(type: CategoryType): Promise<Category[] | null> {
        return this.categoryModel.find({ categoryType: type, parentId: null }).populate('children')
    }
    async getAllCategories(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }
    async updateCategory(id: string, data: CategoryRequestCreateDto): Promise<Category> {
        if (!data) {
            throw new Error("Data is missing!")
        }
        const cate = await this.categoryModel.findByIdAndUpdate(id, {
            name: data.name,
            updatedAt: new Date(),

        }, { new: true, runValidators: true, }).exec();
        if (!cate) {
            throw new Error('Notfound category');
        }
        return cate;
    }


    // async deleteCategory(id: string): Promise<Category|null> {
    //     // check if category is used in products
    //     const category = await this.categoryModel.findById(id).exec();

    // }
}