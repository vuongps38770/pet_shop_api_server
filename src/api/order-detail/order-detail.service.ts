import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { OrderDetail } from './entity/order-detail.entity';
import { OrderDetailCreateDto } from '../../common/dto/order-detail-req.dto';
import { AppException } from 'src/common/exeptions/app.exeption';
import { HttpStatusCode } from 'axios';

@Injectable()
export class OrderDetailService {
    constructor(
        @InjectModel('OrderDetail') private readonly orderDetailModel: Model<OrderDetail>
    ) { }

    async createOrderDetailAndGetOrderDetailId(orderDetailReqDto: OrderDetailCreateDto,ordeId:Types.ObjectId): Promise<Types.ObjectId> {
        try {
            const newOrderDetail = await this.orderDetailModel.create({ ...orderDetailReqDto,orderId:ordeId })
            if (!newOrderDetail) {
                throw new AppException('failed to save order detail')
            }
            return newOrderDetail._id

        } catch (error) {
            throw new Error(error)
        }
    }

    async addOrderIdToOderDetail(orderId: Types.ObjectId, orderDetailId: Types.ObjectId) {
        const result = await this.orderDetailModel.updateOne(
            { _id: orderDetailId },
            { $set: {orderId} }
        );
        if (result.modifiedCount === 0) {
            throw new AppException('Không cập nhật được chi tiết đơn hàng');
        }
    }

    async checkIfOrderDetailExistAndGet(orderDetailId: Types.ObjectId) {
        const orderDetail = this.orderDetailModel.findById(orderDetailId)
        if (!orderDetail) {
            throw new AppException('Not found order detail', HttpStatusCode.NotFound)
        }
        return orderDetail
    }
}
