import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderModule } from '../order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema } from './entity/payment.entity';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  exports:[
    PaymentService
  ],
  imports:[
    forwardRef(() => OrderModule),
    MongooseModule.forFeature([
      {
       name:"Payment",
       schema:PaymentSchema
      }
    ])
  ]
  
})
export class PaymentModule {}
