import { ConflictException, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Category } from "./entity/category.entity";
import { Model, Types } from "mongoose";
import { CategoryRequestCreateDto, CategoryRequestEditDto } from "./dto/category.dto";
import { CategoryType } from "./models/category-.enum";
import { RedisClient } from "src/redis/redis.provider";
import Redis from "ioredis";
import { log } from "console";

@Injectable()
export class CategoryService implements OnModuleInit {
    private readonly cacheKey = 'category_tree';
    constructor(
        @InjectModel('category') private readonly categoryModel: Model<Category>,
        @Inject(RedisClient) private readonly redis: Redis,

    ) {

    }
    async onModuleInit() {
        console.log('Syncing indexes for Category collection...');
        await this.categoryModel.syncIndexes();
        console.log('Indexes synced!');
    }
    async addCategory(data: CategoryRequestCreateDto): Promise<Category> {
        log(data)
        try {
            const createData: any = {
                name: data.name,
            };

            if (data.parentId) {
                createData.parentId = new Types.ObjectId(data.parentId);
            }

            const newCategory = await this.categoryModel.create(createData);

            if (data.parentId) {
                await this.categoryModel.findByIdAndUpdate(
                    new Types.ObjectId(data.parentId),
                    {
                        $push: { children: newCategory._id }
                    },
                    { new: true, runValidators: true }
                );
            }

            return newCategory;
        } catch (error) {
            throw error;
        }
    }


    async getCategoryById(id: string): Promise<Category | null> {
        return this.categoryModel.findById(id).exec();
    }

    async getRootCategory() {
        const data = await this.categoryModel.find({ parentId: null })
        return data
    }

    async getChildCategories(parentId: string): Promise<Category[] | null> {
        if (parentId == "null") return this.getRootCategory()
        return this.categoryModel.find({ parentId: new Types.ObjectId(parentId) })
    }

    async getAllCategories(): Promise<Category[]> {
        // const roots = await this.categoryModel
        //     .find({ parentId: null })
        //     .populate({
        //         path: 'children',
        //         populate: {
        //             path: 'children',
        //             model: 'Category'
        //         }
        //     })
        //     .lean();
        // return roots;
        const cached = await this.redis.get(this.cacheKey);
        if (cached) {
            // return JSON.parse(cached);
        }
        const categories = await this.categoryModel.find().lean();
        const tree = this.buildTreeOptimized(categories);
        await this.redis.set(this.cacheKey, JSON.stringify(tree), 'EX', 3600);
        return tree
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
        await this.redis.del(this.cacheKey);
        return cate;
    }


    async getChildIds(parentId: string): Promise<string[]> {
        const data = await this.categoryModel.findById(parentId)
        if (!data) return []
        return data?.children?.map(child => child.toString()) ?? []
    }

    // async deleteCategory(id: string): Promise<any> {
    //     // check if category is used in products
    //     const category = await this.categoryModel.findById(id).exec();

    // }

    async getAllRootCategory() {
        return this.categoryModel.find({ parentId: null })
    }



    private buildTreeOptimized(flat: any[]): any[] {
        const idMap = new Map<string, any>();
        const roots: any[] = [];

        flat.forEach(cat => {
            idMap.set(String(cat._id), { ...cat, children: [] });
        });

        flat.forEach(cat => {
            if (cat.parentId) {
                const parent = idMap.get(String(cat.parentId));
                if (parent) {
                    parent.children.push(idMap.get(String(cat._id)));
                }
            } else {
                roots.push(idMap.get(String(cat._id)));
            }
        });

        return roots;
    }

    async getAllNestedCategoryIds(rootId: Types.ObjectId) {

        const categories = await this.categoryModel.aggregate([
            {
                $match: { _id: rootId }
            },
            {
                $graphLookup: {
                    from: 'categories',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'descendants'
                }
            },
            {
                $project: {
                    ids: {
                        $concatArrays: [
                            ['$_id'],
                            { $map: { input: '$descendants', as: 'd', in: '$$d._id' } }
                        ]
                    }
                }
            }
        ]);

        return categories[0]?.ids?.map(id => id.toString()) || [];

    }
}