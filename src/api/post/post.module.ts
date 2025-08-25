import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './entity/post.entity';
import { PostMedia, PostMediaSchema } from './entity/post-media.entity';
import { PostLike, PostLikeSchema } from './entity/post-like.entity';
import { PostComment, PostCommentSchema } from './entity/post-comment.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { KafkaModule } from 'src/kafka/kalfka.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [
    MongooseModule.forFeature([
      {name:Post.name, schema:PostSchema},
      {name:PostMedia.name, schema:PostMediaSchema},
      {name:PostLike.name, schema:PostLikeSchema},
      {name:PostComment.name, schema:PostCommentSchema},
    ]),
    CloudinaryModule,
    KafkaModule
  ],
})
export class PostModule {}
