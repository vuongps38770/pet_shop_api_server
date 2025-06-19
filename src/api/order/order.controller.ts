import { Body, Controller, Get, Post, Query, Param, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { OrderCreateReqDto, OrderListReqDto, CalculateOrderPriceReqDto } from './dto/order.req.dto';
import { OrderListResDto, OrderRespondDto } from './dto/order.respond';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('create-order')
  async createOrder(@CurrentUserId() usId: string, @Body() dto: OrderCreateReqDto): Promise<PartialStandardResponse<OrderRespondDto>> {
    const data = await this.orderService.createOrder(usId, dto)
    return {
      data
    }
  }

  @Get('my')
  async getMyOrder(@CurrentUserId() usId:string, @Query() dto:OrderListReqDto ): Promise<PartialStandardResponse<OrderListResDto>>{
    const data = await this.orderService.getOrdersByUser(dto,usId)
    return{data}
  }

  @Patch(':id/confirm')
  async confirmOrder(
    @Param('id') id: string
  ): Promise<PartialStandardResponse<OrderRespondDto>> {
    const data = await this.orderService.confirmOrder(id);
    return { data };
  }

  @Post('calculate-price')
  async calculateOrderPricePreview(@Body() dto: CalculateOrderPriceReqDto):Promise<PartialStandardResponse<any>> {
    const data = await this.orderService.calculateOrderPricePreview(dto);
    return { data };
  }


}
