// import { Injectable, Logger } from "@nestjs/common";
// import { Cron } from "@nestjs/schedule";
// import { PaymentService } from "src/api/payment/payment.service";
// import { OrderService } from "src/api/order/order.service";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model, Types } from "mongoose";
// import { Order } from "src/api/order/entity/order.entity";
// import { RedisQueueName } from "src/redis/constants/redis-queue.constant";
// import { log } from "console";

// interface RefundQueueItem {
//     orderId: string;
//     paymentId: string;
//     timestamp: string;
// }

// @Injectable()
// export class ZalopayRefundService {
//     private readonly logger = new Logger(ZalopayRefundService.name);

//     constructor(
//         private readonly paymentService: PaymentService,
//         private readonly orderService: OrderService,
//         @InjectModel("Order") private readonly orderModel: Model<Order>
//     ) { }

//     @Cron('*/2 * * * *') // Chạy mỗi 2 phút
//     async handleZalopayRefund() {
//         this.logger.log('🔄 Bắt đầu xử lý hoàn tiền Zalopay từ queue...');

//         try {
//             // Lấy item từ queue hoàn tiền
//             const queueItem = await this.orderService['redisService'].popFromQueue(RedisQueueName.ZALOPAY_REFUND_QUEUE);
            
//             if (!queueItem) {
//                 this.logger.log('📭 Queue hoàn tiền trống');
//                 return;
//             }

//             this.logger.log(`📋 Lấy được item từ queue: ${JSON.stringify(queueItem)}`);

//             // Parse data từ queue
//             const refundData = typeof queueItem === 'string' ? JSON.parse(queueItem) : queueItem;
//             const { orderId, paymentId, timestamp } = refundData;

//             // Xử lý hoàn tiền
//             await this.processRefundFromQueue(orderId, paymentId);

//             this.logger.log('Hoàn thành xử lý hoàn tiền Zalopay từ queue');
//         } catch (error) {
//             this.logger.error(` Lỗi trong job hoàn tiền Zalopay: ${error.message}`);
//         }
//     }

//     private async processRefundFromQueue(orderId: string, paymentId: string) {
//         this.logger.log(` Đang xử lý hoàn tiền cho order ${orderId} từ queue`);

//         try {
//             // Lấy thông tin order
//             const order = await this.orderModel.findById(orderId);
//             if (!order) {
//                 this.logger.error(`Không tìm thấy order ${orderId}`);
//                 return;
//             }

//             // Kiểm tra xem đã hoàn tiền chưa
//             if (order.refundStatus === 'REFUNDED') {
//                 this.logger.log(`Order ${orderId} đã được hoàn tiền rồi`);
//                 return;
//             }

//             // Gọi API hoàn tiền Zalopay
//             await this.paymentService.refundZaloPay(
//                 new Types.ObjectId(paymentId), 
//                 `Hoàn tiền đơn hàng ${order.sku}`
//             );
            
//             // Nếu không có lỗi, coi như hoàn tiền thành công
//             // Cập nhật trạng thái hoàn tiền
//             await this.orderModel.findByIdAndUpdate(orderId, {
//                 refundStatus: 'REFUNDED',
//                 refundedAt: new Date(),
//                 refundAmount: order.totalPrice
//             });

//             this.logger.log(`✅ Hoàn tiền thành công cho order ${orderId}, amount: ${order.totalPrice}`);
            
//             // Gửi thông báo cho user
//             try {
//                 await this.orderService['notificationService'].sendOrderNotification(
//                     order.userID.toString(),
//                     orderId,
//                     'REFUNDED',
//                     {
//                         orderSku: order.sku,
//                         refundAmount: order.totalPrice
//                     }
//                 );
//             } catch (error) {
//                 this.logger.warn(`⚠️ Không thể gửi thông báo hoàn tiền cho order ${orderId}: ${error.message}`);
//             }
//         } catch (error) {
//             this.logger.error(`❌ Lỗi khi gọi API hoàn tiền Zalopay cho order ${orderId}: ${error.message}`);
            
//             // Cập nhật trạng thái lỗi
//             await this.orderModel.findByIdAndUpdate(orderId, {
//                 refundStatus: 'FAILED',
//                 refundError: error.message
//             });
//         }
//     }

//     // Hàm manual để test
//     // async manualRefund(orderId: string) {
//     //     this.logger.log(`🔄 Manual hoàn tiền cho order ${orderId}`);
        
//     //     const order = await this.orderModel.findById(orderId);
//     //     if (!order) {
//     //         throw new Error('Order not found');
//     //     }

//     //     // Lấy payment ID để hoàn tiền
//     //     const paymentId = await this.paymentService.getAvailablePaymentIdThatPaidByOrderId(order._id);
//     //     if (!paymentId) {
//     //         throw new Error('Không tìm thấy payment để hoàn tiền');
//     //     }

//     //     await this.processRefundFromQueue(orderId, paymentId);
//     // }
// } 