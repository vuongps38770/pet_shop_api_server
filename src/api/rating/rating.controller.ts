import { Controller, Post, Body, Put, Param, Delete, Get, Query } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating-req.dto';
import { CurrentUser } from 'src/decorators/curent-user.decorator';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  async create(@CurrentUserId()userId:string,@Body() dto: CreateRatingDto) {
    return this.ratingService.create(userId,dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRatingDto) {
    return this.ratingService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ratingService.delete(id);
  }

  @Get('by-product/:product_variant_id')
  async getAllByProductVariant(@Param('product_variant_id') product_variant_id: string) {
    return this.ratingService.getAllByProductVariant(product_variant_id);
  }

  @Get('by-user/:user_id')
  async getAllByUser(@Param('user_id') user_id: string) {
    return this.ratingService.getAllByUser(user_id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ratingService.getById(id);
  }
}
