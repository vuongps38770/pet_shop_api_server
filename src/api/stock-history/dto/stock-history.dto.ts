import { Types } from 'mongoose';
import { StockAction } from '../models/stock-action.enum';

export class StockHistoryDto {
  productId: string | Types.ObjectId;
  variantId: string | Types.ObjectId;
  oldStock: number;
  newStock: number;
  action: StockAction;
  note?: string;
  actionBy?: string;
} 