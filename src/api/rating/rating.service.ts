import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from './entity/rating.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating-req.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
  ) {}

  async create(user_id:string,createDto: CreateRatingDto) {
    // Nếu đã có đánh giá của user cho product_variant thì báo lỗi
    const existed = await this.reviewModel.findOne({
      user_id: user_id,
      product_variant_id: new Types.ObjectId(createDto.product_variant_id),
    });
    if (existed) throw new Error('Bạn đã đánh giá sản phẩm này!');
    return this.reviewModel.create({
      ...createDto,
      user_id: new Types.ObjectId(user_id),
      product_variant_id: new Types.ObjectId(createDto.product_variant_id),
    });
  }

  async update(id: string, updateDto: UpdateRatingDto) {
    return this.reviewModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async delete(id: string) {
    return this.reviewModel.findByIdAndDelete(id);
  }

  async getAllByProductVariant(product_variant_id: string) {
    return this.reviewModel.find({ product_variant_id: new Types.ObjectId(product_variant_id) });
  }

  async getById(id: string) {
    return this.reviewModel.findById(id);
  }

  async getAllByUser(user_id: string) {
    return this.reviewModel.find({ user_id: new Types.ObjectId(user_id) });
  }
}
