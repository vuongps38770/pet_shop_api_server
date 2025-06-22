import { Module } from '@nestjs/common';
import { StockHistoryService } from './stock-history.service';
import { StockHistoryController } from './stock-history.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StockHistorySchema } from './entity/stock-history.entity';

@Module({
  controllers: [StockHistoryController],
  providers: [StockHistoryService],
  imports:[
    MongooseModule.forFeature([
      {
        name:'StockHistory',
        schema:StockHistorySchema
      }
    ])
  ],
  exports:[
    StockHistoryService
  ]
})
export class StockHistoryModule {}
