import { StockAction } from '../models/stock-action.enum';

export class StockHistoryResDto {
  id: string;
  productId: string;
  variantId: string;
  oldStock: number;
  newStock: number;
  action: StockAction;
  note?: string;
  actionBy?: string;
  createdAt: Date;
  updatedAt: Date;
} 