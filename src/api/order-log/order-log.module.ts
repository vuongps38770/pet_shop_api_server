import { Module } from '@nestjs/common';
import { OrderLogService } from './order-log.service';
import { OrderLogController } from './order-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderLog, OrderLogSchema } from './entity/order-log.entity';

@Module({
  controllers: [OrderLogController],
  providers: [OrderLogService],
  exports:[OrderLogService],
  imports:[
    MongooseModule.forFeature([
      {
        name:OrderLog.name,
        schema:OrderLogSchema
      }
    ])
  ]
})
export class OrderLogModule {}
