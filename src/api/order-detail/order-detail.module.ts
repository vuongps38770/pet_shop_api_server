import { Module } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';
import { OrderDetailController } from './order-detail.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderDetailSchema } from './entity/order-detail.entity';

@Module({
  controllers: [OrderDetailController],
  providers: [OrderDetailService],
  exports: [OrderDetailService],
  imports: [
    MongooseModule.forFeature([
      {
        name: "OrderDetail",
        schema: OrderDetailSchema
      }
    ]),
    
  ]
})
export class OrderDetailModule { }
