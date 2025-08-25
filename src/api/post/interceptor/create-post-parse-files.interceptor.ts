import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { CreatePostDto, CreatePostMediaDto } from '../dto/create-post.dto';
import { PostMediaType } from '../entity/post-media.entity';
import { log } from 'console';


@Injectable()
export class ParseFilesToDtoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const files: Express.Multer.File[] = req.files;
    const body = req.body;
    let medias: CreatePostMediaDto[] | undefined;
    if (files?.length) {
      if (!body.types) {
        throw new BadRequestException('Media types are required');
      }

      const typesArray = Array.isArray(body.types) ? body.types : [body.types];

      // Kiểm tra số lượng file và type có khớp không
      if (typesArray.length !== files.length) {
        throw new BadRequestException('Number of types must match number of files');
      }

      medias = files.map((file, index) => {
        const typeStr = typesArray[index];
        const typeEnum = PostMediaType[typeStr as keyof typeof PostMediaType];

        if (!typeEnum) {
          throw new BadRequestException(`Invalid media type at index ${index}: ${typeStr}`);
        }

        return plainToInstance(CreatePostMediaDto, {
          type: typeEnum,
          file
        });
      });
    }

    req.body = plainToInstance(CreatePostDto, {
      content: body.content,
      medias
    });

    return next.handle();
  }
}
