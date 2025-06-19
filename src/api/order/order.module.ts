import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderDetailModule } from '../order-detail/order-detail.module';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressSchema } from '../adress/entity/address.entity';
import { OrderSchema } from './entity/order.entity';
import { AddressModule } from '../adress/address.module';
import { PaymentModule } from '../payment/payment.module';

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
    OrderDetailModule,
    ProductVariantModule,
    AddressModule,
    PaymentModule
  ],
  exports:[
    MongooseModule
  ]
})
export class OrderModule { }
