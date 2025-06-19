import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { Order } from './entity/order.entity';
import { OrderAdminListReqDto, OrderCreateReqDto, OrderListReqDto, OrderReqItem, CalculateOrderPriceDto } from './dto/order.req.dto';
import { OrderDetailService } from '../order-detail/order-detail.service';
import { ProductVariantService } from '../product-variant/product-variant.service';
import { AppException } from 'src/common/exeptions/app.exeption';
import { TimeLimit } from 'src/constants/TimeLimit';
import { OrderStatus } from './models/order-status';
import { OrderDetailResDto, OrderListResDto, OrderRespondDto } from './dto/order.respond';
import { Address } from '../adress/entity/address.entity';
import { OrderMapper } from './mappers/order.mapper';
import { PaymentService } from '../payment/payment.service';
import { PaymentType } from './models/payment-type';

@Injectable()
export class OrderService {

    constructor(
        @InjectModel("Order") private readonly orderModel: Model<Order>,
        @InjectModel("Address") private readonly addressModel: Model<Address>,
        @InjectConnection() private readonly connection: Connection,
        private readonly orderDetailService: OrderDetailService,
        private readonly productVariantService: ProductVariantService,
        private readonly paymentService: PaymentService
    ) { }

    async createOrder(usId: string, dto: OrderCreateReqDto): Promise<OrderRespondDto> {
        const session = await this.connection.startSession()
        session.startTransaction()
        try {

            //tạo cái order mới nhưng ko create nó sẽ bị lỗi tạo 1 cái doc mới mà k có data
            const newOrder = new this.orderModel({
                userID: usId,
                paymentType: dto.paymentType
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

            //ktra voucher nếu có nhmà chưa làm
            if (dto.voucherCode) {
                await this.checkVoucherCode(dto.voucherCode, usId)
                newOrder.voucherID = new Types.ObjectId(dto.voucherCode)
            }

            let orderItemIds: Types.ObjectId[] = []
            let orderServerSumPrice = 0

            for (let item of dto.orderItems) {
                const itemData = await this.productVariantService.getOrderDetailByOrderReqItem(item.variantId, item.quantity)
                const newItem = await this.orderDetailService.createOrderDetailAndGetOrderDetailId(itemData)
                orderServerSumPrice += itemData.promotionalPrice || 0
                orderItemIds.push(newItem._id)
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






            if (dto.paymentType == 'COD') {
                newOrder.status = OrderStatus.NEWORDER
            } else if (dto.paymentType == PaymentType.MOMO
                || dto.paymentType == PaymentType.VNPAY
                || dto.paymentType == PaymentType.ZALOPAY) {
                newOrder.status = OrderStatus.WAIT_FOR_PAYMENT
                newOrder.expiredPaymentDate = new Date(new Date().getTime() + TimeLimit['2Days'])
            } else {

                throw new AppException('Thiếu returnUrl cho thanh toán online', HttpStatus.BAD_REQUEST);

            }
            await newOrder.save({ session })
            await session.commitTransaction()
            return await this.findOrderById((newOrder._id as Types.ObjectId).toString())
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
        if (clientSumPrice != serverSumPrice) {
            throw new AppException(['Sản phẩm đã thay dổi giá'], 409)
        }
    }


    private async checkVoucherCode(voucherCode: string, usid: string) {
        /**todo: thêm voucher */
    }









    async findOrderById(orderId: string): Promise<OrderRespondDto> {
        const order = await this.orderModel.findById(orderId)
            .populate({
                path: 'orderDetailIds',
                model: 'OrderDetail',
            })
            .exec();
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return OrderMapper.toRespondDto(order)
    }














    async getOrdersByUser(
        dto: OrderListReqDto,
        userId: string
    ): Promise<OrderListResDto> {
        const {
            statuses,
            page = 1,
            limit = 10,
            sortBy = 'createdDate',
            sortOrder = 'desc',
        } = dto;

        let filter: any = { userID: userId };
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
            (orders as Order[]).map(async (order) => OrderMapper.toRespondDto(order))
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
            sortBy = 'createdDate',
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
            (orders as Order[]).map(async (order) => OrderMapper.toRespondDto(order))
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

    async updateOrder() {

    }

    async confirmOrder(orderId: string): Promise<OrderRespondDto> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Kiểm tra trạng thái hiện tại
        if (order.status === OrderStatus.CONFIRMED) {
            throw new AppException('Đơn hàng đã được xác nhận trước đó', 400);
        }

        // Kiểm tra điều kiện chuyển trạng thái

        //nếu là online thì bỏ mấy cái chưa thanh toán
        if (
            order.paymentType != PaymentType.COD
        ) {
            if (order.status !== OrderStatus.PAYMENT_SUCCESSFUL) {
                throw new AppException('Đơn hàng online cần thanh toán trước khi xác nhận', 400);
            }
        } else if (order.status !== OrderStatus.NEWORDER) {
            throw new AppException('Không thể xác nhận đơn hàng ở trạng thái này', 400);
        }

        // Cập nhật trạng thái
        order.status = OrderStatus.CONFIRMED;
        await order.save();

        return OrderMapper.toRespondDto(order);
    }


    

    async handlePaymentCallback(orderId: string, paymentData: any): Promise<OrderRespondDto> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.WAIT_FOR_PAYMENT) {
            throw new AppException('Đơn hàng không ở trạng thái chờ thanh toán', HttpStatus.BAD_REQUEST);
        }

        const isPaymentValid = await this.paymentService.verifyPayment(order.paymentType, paymentData);
        if (!isPaymentValid) {
            throw new AppException('Thanh toán không hợp lệ', HttpStatus.BAD_REQUEST);
        }

        order.status = OrderStatus.CONFIRMED;
        await order.save();

        return OrderMapper.toRespondDto(order);
    }

    async calculateOrderPricePreview(dto: CalculateOrderPriceDto) {
        let productTotal = 0;
        let discount = 0;
        for (const item of dto.orderItems) {
            const itemData = await this.productVariantService.getOrderDetailByOrderReqItem(item.variantId, item.quantity);
            productTotal += itemData.promotionalPrice || 0;
        }

        if (dto.voucherCode) {
            discount = await this.getVoucherDiscount(dto.voucherCode, productTotal);
        }
        const shippingFee = await this.caculateShippingFee();
        const finalTotal = productTotal - discount + shippingFee;
        return {
            productTotal,
            discount,
            shippingFee,
            finalTotal,
        };
    }

    // Dummy function for voucher discount
    private async getVoucherDiscount(voucherCode: string, productTotal: number): Promise<number> {
        // TODO: Thay bằng logic thực tế
        return 0;
    }

}
