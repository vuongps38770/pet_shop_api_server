import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Order, OrderDocument } from './entity/order.entity';
import { OrderAdminListReqDto, OrderCreateReqDto, OrderListReqDto, OrderReqItem, CalculateOrderPriceReqDto } from './dto/order.req.dto';
import { OrderDetailService } from '../order-detail/order-detail.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { AppException } from 'src/common/exeptions/app.exeption';
import { TimeLimit } from 'src/constants/TimeLimit';
import { OrderStatus, OrderStatusPermissionMap, OrderStatusSystem, OrderStatusTransitionMap, statusToActionMap } from './models/order-status';
import { OrderCheckoutResDto, OrderDetailResDto, OrderListResDto, OrderRebuyItemDto, OrderRespondDto } from './dto/order.respond';
import { Address } from '../adress/entity/address.entity';
import { OrderMapper } from './mappers/order.mapper';
import { PaymentService } from '../payment/payment.service';
import { PaymentType } from './models/payment-type';
import { UserRole } from '../auth/models/role.enum';
import { error, log } from 'console';
import { PaymentResDto } from '../payment/dto/payment.res';
import { CartService } from '../cart/cart.service';
import { OrderLogService } from '../order-log/order-log.service';
import { OrderAction } from '../order-log/models/order-action.enum';
import { RedisService } from 'src/redis/redis.service';
import { RedisJobName, RedisQueueName } from 'src/redis/constants/redis-queue.constant';
import { VoucherService } from '../voucher/voucher.service';
import { NotificationService } from '../notification/notification.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CartRespondDto } from '../cart/dto/cart-repspond-respond.dto';

@Injectable()
export class OrderService {

    constructor(
        @InjectModel("Order") private readonly orderModel: Model<OrderDocument>,
        @InjectModel("Address") private readonly addressModel: Model<Address>,
        @InjectConnection() private readonly connection: Connection,
        private readonly orderDetailService: OrderDetailService,
        private readonly productVariantService: ProductVariantService,
        private readonly paymentService: PaymentService,
        private readonly cartService: CartService,
        private readonly orderLogService: OrderLogService,
        private readonly redisService: RedisService,
        private readonly voucherService: VoucherService,
        private readonly notificationService: NotificationService,
        @InjectQueue(RedisQueueName.REFUND_QUEUE)
        private readonly refundQueue: Queue
    ) { }

    async createOrder(usId: string, dto: OrderCreateReqDto): Promise<OrderCheckoutResDto> {
        const session = await this.connection.startSession()
        session.startTransaction()
        try {
            //tạo cái order mới nhưng ko create nó sẽ bị lỗi tạo 1 cái doc mới mà k có data
            const newOrder = new this.orderModel({
                userID: new Types.ObjectId(usId),
                paymentType: dto.paymentType,
                sku: this.generateOrderId()
            })

            //ktra dịchi
            const adress = await this.addressModel.findById(dto.shippingAddressId)
            if (!adress) {
                throw new AppException("address not found")
            }
            newOrder.shippingAddress = {
                district: adress.district,
                lat: adress.lat,
                lng: adress.lng,
                province: adress.province,
                receiverFullname: adress.receiverFullname,
                streetAndNumber: adress.streetAndNumber,
                ward: adress.ward,
                refId: adress._id.toString()
            }

            let orderItemIds: Types.ObjectId[] = []
            let orderServerSumPrice = 0
            let productIds: Types.ObjectId[] = []

            for (let item of dto.orderItems) {
                const itemData = await this.productVariantService.getOrderDetailByOrderReqItem(item.variantId, item.quantity)
                const newItem = await this.orderDetailService.createOrderDetailAndGetOrderDetailId(itemData, newOrder._id as Types.ObjectId)
                orderServerSumPrice += itemData.promotionalPrice * itemData.quantity || 0
                orderItemIds.push(newItem._id)
                productIds.push(new Types.ObjectId(itemData.productId));
                await this.productVariantService.decreaseStock(item.variantId, item.quantity);
            }
            newOrder.orderDetailIds = orderItemIds

            dto.totalClientPrice && this.checkSumPrice(dto.totalClientPrice, orderServerSumPrice)
            if (orderItemIds.length === 0) {
                throw new AppException('không thể tạo chi tiết đơn hàng', HttpStatus.INTERNAL_SERVER_ERROR)
            }
            newOrder.productPrice = orderServerSumPrice
            const shippingFee = await this.caculateShippingFee()
            newOrder.shippingFee = shippingFee
            newOrder.totalPrice = shippingFee + orderServerSumPrice

            // Xử lý voucher
            let discount = 0;
            let voucherId: Types.ObjectId | undefined = undefined;
            if (dto.voucherCode) {
                // Tìm voucher theo code
                const voucher = await this.voucherService['voucherModel'].findOne({ code: dto.voucherCode });
                if (!voucher) throw new AppException('Voucher không tồn tại hoặc đã bị xoá', 400);
                // Tính discount
                // discount = await this.voucherService.checkOrderAndCalculateDiscount(
                //     voucher,
                //     newOrder.totalPrice,
                //     productIds,
                //     new Types.ObjectId(usId)
                // );
                discount = await this.voucherService.CalculateDiscount(
                    voucher,
                    newOrder.totalPrice
                );

                newOrder.discount = discount;
                newOrder.totalPrice = newOrder.totalPrice - discount
                voucherId = new Types.ObjectId(voucher._id as string);
            }

            if (dto.paymentType == 'COD') {
                newOrder.status = OrderStatus.NEWORDER
            } else if (dto.paymentType == PaymentType.MOMO
                || dto.paymentType == PaymentType.VNPAY
                || dto.paymentType == PaymentType.ZALOPAY) {
                newOrder.status = OrderStatus.WAIT_FOR_PAYMENT
                newOrder.expiredPaymentDate = new Date(new Date().getTime() + TimeLimit['15mins'])
            } else {
                throw new AppException('Phương thức không hợp lệ', HttpStatus.BAD_REQUEST);
            }
            if (voucherId) newOrder.voucherID = voucherId;
            console.log(newOrder);
            await this.productVariantService.updateVariantStockFromOrder(dto.orderItems, session);
            await newOrder.save({ session })
            let payment: PaymentResDto | undefined = undefined;
            if (dto.paymentType == PaymentType.ZALOPAY) {
                payment = await this.paymentService.createZalopayTransToken(newOrder._id as Types.ObjectId, session);
            }
            await session.commitTransaction()
            if (dto.cartIds) {
                await this.cartService.removeManyCarts(dto.cartIds)
            }
            return {
                orderId: newOrder._id.toString(),
                paymentMethod: newOrder.paymentType,
                payment
            }
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession()
        }
    }
    async caculateShippingFee(): Promise<number> {
        return 0;
    }
    private checkSumPrice(clientSumPrice: number, serverSumPrice: number) {
        // if (clientSumPrice != serverSumPrice) {
        //     throw new AppException(['Sản phẩm đã thay dổi giá'], 409)
        // }
    }



    private generateOrderId(): string {
        const now = new Date();
        const y = now.getFullYear().toString().slice(2);
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);

        return `${y}${m}${d}${h}${mi}${s}${random}`;
    }







    async findOrderById(orderId: string | Types.ObjectId): Promise<OrderRespondDto> {
        const order = await this.orderModel.findById(orderId)
            .populate({
                path: 'orderDetailIds',
                model: 'OrderDetail',
            })
            .exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return OrderMapper.toRespondDto(order, null)
    }


    async findOrderByIdWidthSession(orderId: string | Types.ObjectId, session: ClientSession): Promise<OrderRespondDto> {
        const order = await this.orderModel.findById(orderId)
            .populate({
                path: 'orderDetailIds',
                model: 'OrderDetail',
            })
            .session(session)
            .exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return OrderMapper.toRespondDto(order, null)
    }
    async saveToPaymentIdsWithSession(orderId: string | Types.ObjectId, paymentId: string | Types.ObjectId, session: ClientSession) {
        await this.orderModel.findByIdAndUpdate(orderId, { $addToSet: { paymentIds: paymentId } }, { session })
    }

    async getOrdersByUser(
        dto: OrderListReqDto,
        userId: string
    ): Promise<OrderListResDto> {
        const {
            statuses,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'acs',
        } = dto;

        let filter: any = { userID: new Types.ObjectId(userId) };
        if (statuses && statuses.length > 0) {
            filter.status = { $in: statuses };
        }

        // sort
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Lấy tổng sl
        const total = await this.orderModel.countDocuments(filter);

        // Lấy danh sách đơn
        const orders = await this.orderModel
            .find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'orderDetailIds',
                model: 'OrderDetail',
            })
            .exec();

        // Map sang OrderRespondDto
        const data = await Promise.all(
            (orders as OrderDocument[]).map(async (order) => {
                const latestLog = await this.orderLogService.getLatest(order._id);
                return OrderMapper.toRespondDto(order, latestLog)
            })
        );

        const hasNext = page * limit < total;
        const hasPrevious = page > 1;

        return {
            total,
            page,
            limit,
            data,
            hasNext,
            hasPrevious,
        };
    }




    async getOrdersForAdmin(
        dto: OrderAdminListReqDto
    ): Promise<OrderListResDto> {
        const {
            statuses,
            page = 1,
            limit = 10,
            sortBy = 'updatedAt',
            sortOrder = 'desc',
        } = dto;

        let filter: any = {};
        if (statuses && statuses.length > 0) {
            filter.status = { $in: statuses };
        }

        // Sắp xếp
        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Lấy tổng số lượng
        const total = await this.orderModel.countDocuments(filter);

        // Lấy danh sách order
        const orders = await this.orderModel
            .find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'orderDetailIds',
                model: 'OrderDetail',
            })
            .exec();

        // Map sang OrderRespondDto
        const data = await Promise.all(
            (orders as OrderDocument[]).map(async (order) => {
                const latestLog = await this.orderLogService.getLatest(order._id);
                return OrderMapper.toRespondDto(order, latestLog)
            })
        );

        const hasNext = page * limit < total;
        const hasPrevious = page > 1;

        return {
            total,
            page,
            limit,
            data,
            hasNext,
            hasPrevious,
        };
    }
    async getNewOrderCount(after: Date, types: OrderStatus[]): Promise<number> {
        const filter: any = {
            status: { $in: types },
            createdAt: { $gt: after }
        };
        const data = await this.orderModel.countDocuments(filter)
        return data
    }




    async updateOrderStatus(orderId: string, nextStatus: OrderStatus, userId: string, role: UserRole.ADMIN | UserRole.USER): Promise<any> {
        if (!role) throw new AppException('Bạn không có quyền thực hiện hành động này', HttpStatus.UNAUTHORIZED);
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        if (role === UserRole.USER && order.userID.toString() !== userId) {
            throw new AppException('Bạn không thể thao tác với đơn hàng không thuộc về bạn', HttpStatus.FORBIDDEN);
        }

        const allowedNextStatuses = OrderStatusTransitionMap[order.status];
        if (!allowedNextStatuses.includes(nextStatus)) {
            throw new AppException(`Không thể chuyển trạng thái từ ${order.status} sang ${nextStatus}`, 400);
        }


        const allowedRoles = OrderStatusPermissionMap[nextStatus] || [];

        if (!allowedRoles.includes(role)) {
            throw new AppException('Bạn không có quyền thực hiện hành động này', HttpStatus.UNAUTHORIZED);
        }
        if (nextStatus == OrderStatus.CANCELLED) {
            await this.orderLogService.createLog({
                action: OrderAction.CANCEL_ORDER,
                orderId: order._id.toString(),
                performed_by: role,
            });
            await this.searchAvailablePaymentAndSetQueueToRefund(order._id);
            if (order && order.voucherID) {
                await this.voucherService.cancelVoucherUsage(order.voucherID, order.userID, order._id);
            }
        }
        order.status = nextStatus;
        await order.save();

        // Gửi thông báo cho user về trạng thái đơn hàng
        try {
            await this.notificationService.sendOrderNotification(
                order.userID.toString(),
                order._id.toString(),
                nextStatus,
                {
                    orderSku: order.sku,
                    totalPrice: order.totalPrice.toString(),
                    paymentType: order.paymentType
                }
            );
        } catch (error) {
            log(`❌ Lỗi khi gửi thông báo cho order ${order._id}:`, error);
        }

        return order;
    }


    async systemUpdateOrderStatus(orderId: string | Types.ObjectId, nextStatus: OrderStatusSystem): Promise<any> {
        const order = await this.orderModel.findById(orderId) as OrderDocument;
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        console.log("order:", order._id);
        if (order.status === nextStatus) {
            return order;
        }
        order.status = nextStatus;
        const action = statusToActionMap[nextStatus];
        if (!action) {
            throw new Error(`No matching OrderAction for status: ${order.status}`);
        }
        await order.save();
        if (nextStatus == OrderStatus.CANCELLED) {
            await this.searchAvailablePaymentAndSetQueueToRefund(order._id)
        }
        log('createdLog', order._id + " " + action)
        await this.orderLogService.createLog({
            action: action,
            orderId: order._id.toString(),
            performed_by: 'SYSTEM',
        });
        // Gửi thông báo cho user về trạng thái đơn hàng
        try {
            await this.notificationService.sendOrderNotification(
                order.userID.toString(),
                order._id.toString(),
                nextStatus,
                {
                    orderSku: order.sku,
                    totalPrice: order.totalPrice.toString(),
                    paymentType: order.paymentType,
                    performedBy: 'SYSTEM'
                }
            );
        } catch (error) {
            log(`❌ Lỗi khi gửi thông báo cho order ${order._id}:`, error);
        }
        log(order)
        return order;
    }

    private async searchAvailablePaymentAndSetQueueToRefund(orderId: Types.ObjectId) {
        const availableRefundAblePaymentId = await this.paymentService.getAvailablePaymentIdThatPaidByOrderId(orderId)
        if (availableRefundAblePaymentId) {
            log("Đơn hàng " + availableRefundAblePaymentId + " sẽ đẩy vào queue")

            // Đẩy vào queue hoàn tiền Zalopay
            await this.refundQueue.add(RedisJobName.REFUND_JOB, {
                orderId: orderId.toString(),
                paymentId: availableRefundAblePaymentId,
                timestamp: new Date().toISOString()
            });

            log(`✅ Đã đẩy order ${orderId} vào queue hoàn tiền Zalopay`);
        } else {
            log("Không có đơn hàng khả dụng")
        }
    }



    async handlePaymentCallback(orderId: string, paymentData: any): Promise<OrderRespondDto> {
        const order = await this.orderModel.findOne({ sku: orderId }) || await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.WAIT_FOR_PAYMENT) {
            throw new AppException('Đơn hàng không ở trạng thái chờ thanh toán', HttpStatus.BAD_REQUEST);
        }

        order.status = OrderStatus.CONFIRMED;
        await order.save();

        // Gửi thông báo xác nhận thanh toán
        try {
            await this.notificationService.sendOrderNotification(
                order.userID.toString(),
                order._id.toString(),
                OrderStatus.CONFIRMED,
                {
                    orderSku: order.sku,
                    totalPrice: order.totalPrice.toString(),
                    paymentType: order.paymentType,
                    paymentData: paymentData
                }
            );
        } catch (error) {
            log(`❌ Lỗi khi gửi thông báo xác nhận thanh toán cho order ${order._id}:`, error);
        }

        return OrderMapper.toRespondDto(order, null);
    }

    async calculateOrderPricePreview(dto: CalculateOrderPriceReqDto, userId: string) {
        let productTotal = 0;
        let discount = 0;
        let productIds: Types.ObjectId[] = [];
        for (const item of dto.orderItems) {
            const itemData = await this.productVariantService.getOrderDetailByOrderReqItem(item.variantId, item.quantity);
            log(itemData)
            productTotal += itemData.promotionalPrice * itemData.quantity || 0;
            productIds.push(new Types.ObjectId(itemData.productId));
        }
        const itemdataMapped = await this.productVariantService.getVariantsGroupedByProductIdFromVariantIds(dto.orderItems)
        // log(JSON.stringify(test))
        if (dto.voucherCode && userId) {
            discount = await this.getVoucherDiscount(dto.voucherCode, productTotal, productIds, userId);
            console.log("discount", discount);

        }
        const shippingFee = await this.caculateShippingFee();
        const finalTotal = productTotal - discount + shippingFee;
        return {
            productTotal,
            discount,
            shippingFee,
            finalTotal,
            items: itemdataMapped
        };
    }

    // Tính giảm giá voucher 
    private async getVoucherDiscount(voucherCode: string, productTotal: number, productIds: Types.ObjectId[], userId: string): Promise<number> {
        // Tìm voucher theo code
        const voucher = await this.voucherService['voucherModel'].findOne({ code: voucherCode });
        if (!voucher) return 0;
        // Kiểm tra user đã lưu voucher chưa và chưa dùng
        // const voucherUser = await this.voucherService['voucherUserModel'].findOne({ voucher_id: voucher._id, user_id: new Types.ObjectId(userId) });
        // if (!voucherUser) return 0;
        // Tính discount
        try {
            // return await this.voucherService.checkOrderAndCalculateDiscount(
            //     voucher,
            //     productTotal,
            //     productIds,
            //     new Types.ObjectId(userId)
            // );
            return await this.voucherService.CalculateDiscount(voucher, productTotal)
        } catch {
            return 0;
        }
    }



    async findByIdAndDelete(order_id: Types.ObjectId | string) {
        await this.orderModel.findByIdAndDelete(order_id)
    }




    async getAllOrderInfoById(orderId: Types.ObjectId) {
        const order = await this.orderModel.aggregate([
            {
                $match: { _id: orderId }
            },
            {
                $lookup: {
                    foreignField: "orderId",
                    localField: "_id",
                    from: 'orderlogs',
                    as: 'orderlogs'
                }
            },
            {
                $lookup: {
                    foreignField: "voucherID",
                    localField: "_id",
                    from: 'vouchers',
                    as: 'voucher'
                }
            }
        ])
        return order
    }


    async getReBuyOrdorder(orderId: string): Promise<OrderRebuyItemDto[]> {
        const order = await this.orderModel.findById(new Types.ObjectId(orderId)).populate({
            path: 'orderDetailIds',
            populate: 'variantId productId',
        })
        return OrderMapper.toOrderRebuyItem(order)
    }

    async getSuggestOrderInfoBySku(sku: string) {
        try {
            const order = await this.orderModel.findOne({sku:sku}).select('_id orderDetailIds paymentType shippingAddress productPrice totalPrice status sku')
            if (!order) return null
            return order
        } catch (error) {
            return null
        }


    }

    async getSuggestOrderInfoById(id: string) {
        try {
            const order = await this.orderModel.findById(id).select('_id orderDetailIds paymentType shippingAddress productPrice totalPrice status sku')
            if (!order) return null
            return order
        } catch (error) {
            return null
        }


    }
}
