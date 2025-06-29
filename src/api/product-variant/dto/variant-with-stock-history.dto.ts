import { VariantRespondDto } from "src/api/products/dto/product-respond.dto";
import { StockHistoryResDto } from "src/api/stock-history/dto/stock-history-res.dto";

export class VariantWithStockHistoryDto {
  variant: any;
  stockHistory: StockHistoryResDto[];
} 

