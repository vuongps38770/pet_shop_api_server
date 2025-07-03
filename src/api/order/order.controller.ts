import { Body, Controller, Get, Post, Query, Param, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentUserId } from 'src/decorators/current-user-id.decorator';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { OrderCreateReqDto, OrderListReqDto, CalculateOrderPriceReqDto } from './dto/order.req.dto';
import { OrderCheckoutResDto, OrderListResDto, OrderRespondDto } from './dto/order.respond';
import { OrderStatus } from './models/order-status';
import { CurrentUser } from 'src/decorators/curent-user.decorator';
import { User } from '../auth/entity/user.entity';
import { log } from 'console';
import { Public } from 'src/decorators/public.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('create-order')
  async createOrder(@CurrentUserId() usId: string, @Body() dto: OrderCreateReqDto): Promise<PartialStandardResponse<OrderCheckoutResDto>> {
    const data = await this.orderService.createOrder(usId, dto)
    return {
      data
    }
  }

  @Get('my')
  async getMyOrder(@CurrentUserId() usId: string, @Query() dto: OrderListReqDto): Promise<PartialStandardResponse<OrderListResDto>> {
    const data = await this.orderService.getOrdersByUser(dto, usId)
    return { data }
  }

  @Public()
  @Get('admin/get-orders')
  async getOrders(@Query() dto: OrderListReqDto): Promise<PartialStandardResponse<OrderListResDto>> {
    const data = await this.orderService.getOrdersForAdmin(dto)
    return { data }
  }

  @Post('calculate-price')
  async calculateOrderPricePreview(@CurrentUserId() usId: string, @Body() dto: CalculateOrderPriceReqDto): Promise<PartialStandardResponse<any>> {
    const data = await this.orderService.calculateOrderPricePreview(dto, usId);
    return { data };
  }


  @Post(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body('nextStatus') nextStatus: OrderStatus,
    @CurrentUser() user: any
  ): Promise<PartialStandardResponse<any>> {
    log(user)
    const data = await this.orderService.updateOrderStatus(orderId, nextStatus, user.sub, user.role);
    return {
      data
    }
  }




}
