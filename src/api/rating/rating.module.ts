import { forwardRef, Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './entity/rating.entity';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { ProductModule } from '../products/product.module';
import { OrderDetailModule } from '../order-detail/order-detail.module';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    forwardRef(() => ProductModule),
    OrderDetailModule,
    CloudinaryModule
  ],
  controllers: [RatingController],
  providers: [RatingService,
    {
      provide: 'REDIS_RATING',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const isSecure = redisUrl.startsWith('rediss://');
        return new Redis(redisUrl, {
          tls: isSecure ? {} : undefined,
        });
      },
    },
  ],
  exports: [
    'REDIS_RATING',
    RatingService
  ]
})
export class RatingModule { }
