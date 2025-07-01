import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './entity/rating.entity';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { ProductModule } from '../products/product.module';
import { OrderDetailModule } from '../order-detail/order-detail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    ProductModule,
    OrderDetailModule
  ],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule { }
