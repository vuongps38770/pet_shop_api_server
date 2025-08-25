import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreatePostMediaDto } from "./create-post.dto";

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePostMediaDto)
    mediasToAdd?: CreatePostMediaDto[];

    @IsOptional()
    @IsArray()
    @Type(() => String)
    mediasToRemove?: string[];
}