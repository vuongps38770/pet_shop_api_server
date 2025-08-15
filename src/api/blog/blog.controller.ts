import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-status.dto';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) { }

  @Get()
  async getBlogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<PartialStandardResponse<any>> {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const data = await this.blogService.findAll(pageNum, limitNum);
    return { data }
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string): Promise<PartialStandardResponse<any>> {
    const blog = await this.blogService.findById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return {
      data: blog
    };
  }


  @Post()
  async createBlog(@Body() createBlogDto: CreateBlogDto): Promise<PartialStandardResponse<any>> {
    const data = await this.blogService.create(createBlogDto);
    return { data }
  }

  @Put(':id')
  async updateBlog(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto): Promise<PartialStandardResponse<any>> {
    const blog = await this.blogService.update(id, updateBlogDto);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return { data: blog };
  }

  @Patch(':id/status')
  async updateBlogStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBlogStatusDto,
  ): Promise<PartialStandardResponse<any>> {
    const data = await this.blogService.updateStatus(id, updateStatusDto);
    return { data }
  }

  @Delete(':id')
  async deleteBlog(@Param('id') id: string): Promise<PartialStandardResponse<any>>  {
    await this.blogService.delete(id);
    return{}
  }
}
