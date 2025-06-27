export class CreateRatingDto {
  productId: string;
  rating: number;
  comment?: string;
}

export class UpdateRatingDto {
  rating?: number;
  comment?: string;
}
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReviewQueryType {
  LATEST = 'latest',
  POPULAR = 'popular',
  MY = 'my'
}

export class GetProductReviewsQuery {
  @IsMongoId()
  productId: string;

  @IsEnum(ReviewQueryType)
  @IsOptional()
  type: ReviewQueryType = ReviewQueryType.LATEST;

  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
