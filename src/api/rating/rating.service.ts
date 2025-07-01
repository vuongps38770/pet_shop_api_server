import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Review } from './entity/rating.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating-req.dto';
import { RatingResDto } from './dto/rating-res.dto';
import { ProductVariant } from '../product-variant/entity/product-variant.entity';
import { Product } from '../products/entity/product.entity';
import { OrderDetail } from '../order-detail/entity/order-detail.entity';
import { log } from 'console';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    @InjectModel("Product") private readonly productModel: Model<Product>,
    @InjectModel('OrderDetail') private readonly orderDetailModel: Model<OrderDetail>

  ) { }

  async create(user_id: string, createDto: CreateRatingDto) {
    // Nếu đã có đánh giá của user cho product_variant thì báo lỗi
    const existed = await this.reviewModel.findOne({
      user_id: user_id,
      product_variant_id: new Types.ObjectId(createDto.productId),
    });
    if (existed) throw new Error('Bạn đã đánh giá sản phẩm này!');
    return this.reviewModel.create({
      ...createDto,
      user_id: new Types.ObjectId(user_id),
      productId: new Types.ObjectId(createDto.productId),
    });
  }

  async update(id: string, updateDto: UpdateRatingDto) {
    return this.reviewModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async delete(id: string) {
    return this.reviewModel.findByIdAndDelete(id);
  }

  async getAllByProductVariant(productId: string): Promise<RatingResDto[]> {
    return this.reviewModel.find({ productId: new Types.ObjectId(productId) });
  }

  async getById(id: string) {
    return this.reviewModel.findById(id);
  }

  async getAllByUser(user_id: string) {
    return this.reviewModel.find({ user_id: new Types.ObjectId(user_id) });
  }

  async ratePost(user_id: string, action: 'LIKE' | 'DISLIKE', ratingId: string) {
    let post: (Document<unknown, {}, Review, {}> & Review & { _id: Types.ObjectId; } & { __v: number; }) | null;
    if (action == 'LIKE') {
      post = await this.reviewModel.findByIdAndUpdate(ratingId, {
        $addToSet: {
          likeList: user_id
        },
        $pull: {
          disLikeList: user_id
        }
      },
        { new: true }
      )
    } else {
      post = await this.reviewModel.findByIdAndUpdate(ratingId, {
        $addToSet: {
          disLikeList: user_id
        },
        $pull: {
          likeList: user_id
        },
      },
        { new: true }
      )
    }


  }

  async getReviewsByProduct(
    productId: string,
    type: 'popular' | 'latest' | 'my',
    userId?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const query: any = {
      productId: new Types.ObjectId(productId)
    };

    if (type === 'my' && userId) {
      query.user_id = new Types.ObjectId(userId);
    }

    const sort: any = {};
    if (type === 'popular') {
      sort['likeList'] = -1;
    } else {
      sort['createdAt'] = -1;
    }
    let isBought = await this.hasUserBoughtProduct(productId, userId)
    const reviews = await this.reviewModel
      .find(query)
      .populate('user_id', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const product = await this.productModel.findById(productId)
      .select('_id name images')

    const userObjectId = userId ? new Types.ObjectId(userId) : null;

    const mappedReviews = reviews.map((review) => {
      const isLiked = userObjectId
        ? review.likeList?.some((id: any) => id.toString() === userObjectId.toString())
        : false;

      const isDisliked = userObjectId
        ? review.disLikeList?.some((id: any) => id.toString() === userObjectId.toString())
        : false;
      const isMine = userObjectId
        ? (
          review.user_id?._id
            ? review.user_id._id.toString() === userObjectId.toString()
            : review.user_id.toString() === userObjectId.toString()
        )
        : false;
      return {
        ...review,
        isLiked,
        isDisliked,
        isMine,
      };
    });

    return {
      items: mappedReviews,
      isBought,
      product
    };
  }
  async hasUserBoughtProduct(productId: string, userId?: string): Promise<boolean> {
    if (!userId) {
      console.log('❌ No userId provided');
      return false;
    }

    // Log các tham số truyền vào
    console.log('🔎 Checking if user bought product:');
    console.log('ProductId:', productId, '| typeof:', typeof productId);
    console.log('UserId:', userId, '| typeof:', typeof userId);
    if (!userId) return false
    const result = await this.orderDetailModel.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },
      {
        $lookup: {
          from: 'productvariants',
          localField: 'variantId',
          foreignField: '_id',
          as: 'variant'
        }
      },
      {
        $addFields: {
          variantId: { $toObjectId: '$variantId' }
        }
      },
      { $unwind: '$variant' },
      {
        $match: {
          'variant.productId': new Types.ObjectId(productId),
          'order.userID': new Types.ObjectId(userId),
          'order.status': 'RECEIVED'
        }
      },
      { $limit: 1 }
    ]);
    log(JSON.stringify(result))
    return result.length > 0;
  }
}
