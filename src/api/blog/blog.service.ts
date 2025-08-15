import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './entity/blog.entity';
import { Model } from 'mongoose';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-status.dto';

@Injectable()
export class BlogService {
    constructor(
        @InjectModel(Blog.name) private blogModel: Model<BlogDocument>
    ) { }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            this.blogModel
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.blogModel.countDocuments(),
        ]);

        return {
            blogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findById(id: string) {
        const blog = await this.blogModel.findById(id).lean();
        if (!blog) {
            throw new Error('Blog not found');
        }
        return blog;
    }



    async create(createBlogDto: CreateBlogDto) {
        const newBlog = new this.blogModel({
            ...createBlogDto,
            status: createBlogDto.status || 'draft',
        });

        const savedBlog = await newBlog.save();
        return savedBlog.toObject();
    }

    async update(id: string, updateBlogDto: UpdateBlogDto) {
        const updatedBlog = await this.blogModel.findByIdAndUpdate(
            id,
            { ...updateBlogDto },
            { new: true }
        ).lean();

        if (!updatedBlog) {
            throw new Error('Blog not found');
        }

        return updatedBlog;
    }


    async updateStatus(id: string, dto: UpdateBlogStatusDto) {
        const updatedBlog = await this.blogModel.findByIdAndUpdate(
            id,
            { status: dto.status },
            { new: true, select: '_id status updatedAt' }
        ).lean();

        if (!updatedBlog) {
            throw new Error('Blog not found');
        }

        return updatedBlog
    }

    async delete(id: string) {
        const deletedBlog = await this.blogModel.findByIdAndDelete(id).lean();

        if (!deletedBlog) {
            throw new Error('Blog not found');
        }

        return {
            success: true,
            message: 'Xóa blog thành công',
        };
    }
}
