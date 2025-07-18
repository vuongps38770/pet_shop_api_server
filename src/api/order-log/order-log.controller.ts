import { Controller, Get, Param } from '@nestjs/common';
import { OrderLogService } from './order-log.service';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';

@Controller('order-log')
export class OrderLogController {
  constructor(private readonly orderLogService: OrderLogService) { }

  @Get('all/:orderId')
  async getAllOrderLogsByOrderId(@Param('orderId') orderId: string): Promise<PartialStandardResponse<any>> {
    const data = await this.orderLogService.getAllOrderLogsByOrderId(orderId)
    return { data }
  }

}
