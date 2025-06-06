import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Category } from "./entity/category.entity";
import { Model } from "mongoose";
import { CategoryRequestCreateDto, CategoryRequestEditDto } from "./dto/category.dto";
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
        try {
            const newCategory = await this.categoryModel.create({
                categoryType: data.categoryType || null,
                name: data.name,
                parentId: data.parentId || null,
                isRoot: data.isRoot
            },);
            if (data.parentId) {
                await this.categoryModel.findByIdAndUpdate(
                    data.parentId,
                    {
                        $push: { children: newCategory._id }
                    },
                    { new: true, runValidators: true }
                )
            }
            return newCategory
        } catch (error) {
            if (error.code === 11000) {
                // Lấy thông tin field trùng từ error.keyValue
                const duplicateField = Object.keys(error.keyValue)[0];
                const duplicateValue = error.keyValue[duplicateField];

                throw new ConflictException({
                    success: false,
                    code: 409,
                    message: 'Duplicate category name for the same parent or type',
                    errors: [
                        {
                            field: duplicateField,
                            value: duplicateValue,
                            issue: 'This category name already exists with the same parent or categoryType.',
                        },
                    ],
                });
            }
            throw error;
        }


    }
    
    async getCategoryById(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).exec();
    }
    async getCategoriesByType(type: CategoryType): Promise<Category[] | null> {
        return this.categoryModel.find({ categoryType: type, parentId: null }).populate('children')
    }
    async getChildCategories(parentId:string): Promise<Category[] | null> {
        return this.categoryModel.find({  parentId })
    }
    async getAllCategories(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }
    async updateCategory(data: CategoryRequestEditDto): Promise<Category> {
        if (!data) {
            throw new Error("Data is missing!")
        }
        const cate = await this.categoryModel.findByIdAndUpdate(data.id, {
            name: data.name,
            updatedAt: new Date(),

        }, { new: true, runValidators: true, }).exec();
        if (!cate) {
            throw new Error('Notfound category');
        }
        return cate;
    }


    async getChildIds(parentId:string):Promise<string[]>{
        const data = await this.categoryModel.findById(parentId)
        if(!data) return []
        return data?.children?.map(child => child.toString()) ?? []
    }

    // async deleteCategory(id: string): Promise<Category|null> {
    //     // check if category is used in products
    //     const category = await this.categoryModel.findById(id).exec();

    // }
}