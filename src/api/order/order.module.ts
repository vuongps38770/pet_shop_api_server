import { forwardRef, Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderDetailModule } from '../order-detail/order-detail.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressSchema } from '../adress/entity/address.entity';
import { OrderSchema } from './entity/order.entity';
import { AddressModule } from '../adress/address.module';
import { PaymentModule } from '../payment/payment.module';
import { CartModule } from '../cart/cart.module';
import { OrderLogModule } from '../order-log/order-log.module';
import { RedisModule } from 'src/redis/redis.module';
import { VoucherModule } from '../voucher/voucher.module';
import { NotificationModule } from '../notification/notification.module';
import { BullModule } from '@nestjs/bull';
import { RedisQueueName } from 'src/redis/constants/redis-queue.constant';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [
    MongooseModule.forFeature([
      {
        name: "Order",
        schema: OrderSchema
      }
    ]),
    BullModule.registerQueue({ name: RedisQueueName.REFUND_QUEUE }),
    OrderDetailModule,
    ProductVariantModule,
    AddressModule,
    CartModule,
    forwardRef(() => PaymentModule),
    OrderLogModule,
    RedisModule,
    VoucherModule,
    NotificationModule
  ],
  exports: [
    MongooseModule,
    OrderService
  ]
})
export class OrderModule { }
