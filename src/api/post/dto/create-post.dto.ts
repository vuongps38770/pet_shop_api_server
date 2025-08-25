import { IsOptional, IsString } from "class-validator"
import { PostMediaType } from "../entity/post-media.entity"

export class CreatePostDto{
    content:string
    medias?:CreatePostMediaDto[]
}

export class CreatePostMediaDto{
    type:PostMediaType
    file:Express.Multer.File
}

export class CreatePostBodyDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString({ each: true })
  types?: (keyof typeof PostMediaType)[];
}
