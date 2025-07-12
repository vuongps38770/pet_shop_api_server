import { Controller, Post, Body, Put, Param, Delete, Get, Query } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, GetProductReviewsQuery, UpdateRatingDto } from './dto/rating-req.dto';
import { CurrentUser } from 'src/decorators/curent-user.decorator';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { RatingResDto } from './dto/rating-res.dto';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) { }

  @Post()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateRatingDto): Promise<PartialStandardResponse<void>> {
    await this.ratingService.create(userId, dto);
    return {}
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRatingDto): Promise<PartialStandardResponse<void>> {
    await this.ratingService.update(id, dto);
    return {}
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<PartialStandardResponse<void>> {
    await this.ratingService.delete(id);
    return {}
  }

  @Get('by-product/:product_variant_id')
  async getAllByProductVariant(@Param('product_variant_id') product_variant_id: string): Promise<PartialStandardResponse<RatingResDto[]>> {
    const data = await this.ratingService.getAllByProductVariant(product_variant_id);
    return {
      data
    }
  }

  @Get('by-user/:user_id')
  async getAllByUser(@Param('user_id') user_id: string) {
    return this.ratingService.getAllByUser(user_id);
  }

  @Get('special')
  async getSpecialRating(): Promise<PartialStandardResponse<any>> {
    const data = await this.ratingService.getSpecialRating()
    return { data }
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ratingService.getById(id);
  }

  @Post('rate-post')
  async ratePost(@CurrentUserId() usId: string, @Body("action") action: 'LIKE' | 'DISLIKE', @Body("ratingId") ratingId: string) {
    return this.ratingService.ratePost(usId, action, ratingId)
  }

  @Get()
  async getProductReviews(
    @Query() query: GetProductReviewsQuery,
    @CurrentUserId() userId: string
  ): Promise<PartialStandardResponse<any>> {
    const reviews = await this.ratingService.getReviewsByProduct(
      query.productId,
      query.type,
      userId,
      query.page,
      query.limit
    );

    return { data: reviews };
  }

}
