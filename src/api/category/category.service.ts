import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Category } from "./entity/category.entity";
import { Model } from "mongoose";
import { CategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoryService {

    constructor(
        @InjectModel('category') private readonly categoryModel: Model<Category>

    ) {
        
    }
    async addCategory(category: CategoryDto): Promise<Category> {
        const newCategory = new this.categoryModel(category);
        return newCategory.save();
    }

    async getCategoryById(id: string): Promise<Category|null> {
        return this.categoryModel.findById(id).exec();
    }
    async getAllCategories(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }
    async updateCategory(id: string, data:CategoryDto): Promise<Category> {
        if(!data){
            throw new Error("Data is missing!")
        }
        const cate=  await this.categoryModel.findByIdAndUpdate(id,{
            name: data.name,
            description: data.description,
            updatedAt: new Date()
        }, { new: true,runValidators:true, }).exec();
        if(!cate){
            throw new Error('Notfound category');
        }
        return cate;
    }


    // async deleteCategory(id: string): Promise<Category|null> {
    //     // check if category is used in products
    //     const category = await this.categoryModel.findById(id).exec();
        
    // }
}