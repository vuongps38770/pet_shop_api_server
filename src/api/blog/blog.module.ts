import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './entity/blog.entity';

@Module({
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
  imports:[
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ]
})
export class BlogModule {}
