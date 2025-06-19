import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/api/order/entity/order.entity'; 
import { OrderStatus } from 'src/api/order/models/order-status'; 
import { OrderDetailService } from 'src/api/order-detail/order-detail.service';
import { ProductVariantService } from 'src/api/product-variant/product-variant.service';

@Injectable()
export class OrderAutoCancelService {
  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly orderDetailService: OrderDetailService,
    private readonly productVariantService: ProductVariantService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAutoCancelOrders() {
    const now = new Date();
    // Tìm các đơn hết hạn và đang chờ thanh toán
    const expiredOrders = await this.orderModel.find({
      status: OrderStatus.WAIT_FOR_PAYMENT,
      expiredPaymentDate: { $lt: now }
    });
    // Cập nhật trạng thái
    await this.orderModel.updateMany(
      {
        status: OrderStatus.WAIT_FOR_PAYMENT,
        expiredPaymentDate: { $lt: now }
      },
      { $set: { status: OrderStatus.CANCELLED } }
    );
    // Trả lại stock cho từng đơn
    for (const order of expiredOrders) {
      if (order.orderDetailIds && order.orderDetailIds.length > 0) {
        for (const detailId of order.orderDetailIds) {
          const detail = await this.orderDetailService.checkIfOrderDetailExistAndGet(detailId);
          if (detail && detail.variantId && detail.quantity) {
            await this.productVariantService.increaseStock(detail.variantId.toString(), detail.quantity);
          }
        }
      }
    }
  }
}