import { IsEnum } from 'class-validator';

export class UpdateBlogStatusDto {
  @IsEnum(['draft', 'published'], {
    message: 'Status must be either draft or published',
  })
  status: 'draft' | 'published';
}
