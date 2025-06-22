import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StockHistory } from './entity/stock-history.entity';
import { StockHistoryDto } from './dto/stock-history.dto';
import { StockHistoryResDto } from './dto/stock-history-res.dto';

@Injectable()
export class StockHistoryService {
  constructor(
    @InjectModel(StockHistory.name)
    private readonly stockHistoryModel: Model<StockHistory>,
  ) {}

  async create(dto: StockHistoryDto): Promise<StockHistoryResDto> {
    const created = await this.stockHistoryModel.create(dto);
    return this.toResDto(created);
  }

  async findByVariantId(variantId: string | Types.ObjectId): Promise<StockHistoryResDto[]> {
    const logs = await this.stockHistoryModel.find({ variantId }).sort({ createdAt: -1 });
    return logs.map((doc) => this.toResDto(doc));
  }









  

  toResDto(doc: StockHistory): StockHistoryResDto {
    return {
      id: doc._id ? doc._id.toString() : '',
      productId: doc.productId?.toString(),
      variantId: doc.variantId?.toString(),
      oldStock: doc.oldStock,
      newStock: doc.newStock,
      action: doc.action,
      note: doc.note,
      actionBy: doc.actionBy,
      createdAt: doc['createdAt'],
      updatedAt: doc['updatedAt'],
    };
  }
}
