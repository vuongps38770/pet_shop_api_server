import { Body, Controller, Get, Param, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { PostService } from './post.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreatePostBodyDto, CreatePostDto, CreatePostMediaDto } from './dto/create-post.dto';
import { plainToInstance } from 'class-transformer';
import { PostMediaType } from './entity/post-media.entity';
import { ParseFilesToDtoInterceptor } from './interceptor/create-post-parse-files.interceptor';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { Types } from 'mongoose';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { CreatePostCommentDto } from './dto/create-comment.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post("create")
  @UseInterceptors(AnyFilesInterceptor(), ParseFilesToDtoInterceptor)
  async createPost(@Body() body: CreatePostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUserId() userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    await this.postService.createPost(userObjectId, body)
  }

  @Get("explore")
  async explore(@CurrentUserId() userId: string, @Query('page') page: number, @Query('limit') limit: number)
    : Promise<PartialStandardResponse<any>> {
    const userObjectId = new Types.ObjectId(userId);
    const data = await this.postService.getPosts(page, limit, userObjectId)
    return { data }
  }

  @Post("like/:postId")
  async likePost(@CurrentUserId() userId: string, @Param("postId") postId: string)
    : Promise<PartialStandardResponse<any>> {
    const userObjectId = new Types.ObjectId(userId);
    const postObjectId = new Types.ObjectId(postId);
    const data = await this.postService.likePostToggle(userObjectId, postObjectId)
    return { data }
  }


  @Get("my")
  async getMyPost(@CurrentUserId() userId: string)
    : Promise<PartialStandardResponse<any>> {
    const userObjectId = new Types.ObjectId(userId);
    const data = await this.postService.getMyPosts(userObjectId)
    return { data }
  }

  @Post("comment")
  async comment(@CurrentUserId() userId: string, @Body() dto: CreatePostCommentDto): Promise<PartialStandardResponse<any>> {
    const userObjectId = new Types.ObjectId(userId);
    const data = await this.postService.commentPost(userObjectId, dto)
    return { data }
  }

  @Get("comment/:postId")
  async getCommentByPostId(@Param("postId") postId: string,@Query("page") page:any,@Query("limit") limit:any): Promise<PartialStandardResponse<any>> {
    const postObjectId = new Types.ObjectId(postId);
    const data = await this.postService.getCommentsWithReplyCount(postObjectId,Number(page),Number(limit))
    return { data }
  }

  @Get("comment-reply/:commentId")
  async getCommentReply(@Param("commentId") commentId: string,@Query("page") page:any,@Query("limit") limit:any): Promise<PartialStandardResponse<any>> {
    const commentObjectId = new Types.ObjectId(commentId);
    const data = await this.postService.getRepliesOfComment(commentObjectId,Number(page),Number(limit))
    return { data }
  }



  @Get(":postId")
  async getPostDetailByIdasync(@CurrentUserId() userId: string, @Param("postId") postId: string): Promise<PartialStandardResponse<any>> {
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);
    const data = await this.postService.getPostById(postObjectId,userObjectId)
    return { data }
  }
}
