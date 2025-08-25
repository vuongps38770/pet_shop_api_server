import { IsString, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class CreatePostCommentDto {
    @IsString()
    @IsNotEmpty({ message: 'postId không được để trống' })
    postId: string;

    @ValidateIf(o => o.parent_id !== null)
    @IsString({ message: 'parent_id phải là string' })
    parent_id: string | null;

    @IsOptional()
    @IsString({ message: 'root_id phải là string nếu có' })
    root_id?: string | null;

    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    content: string;

    @IsOptional()
    @IsString()
    replyRegex?:string
}
