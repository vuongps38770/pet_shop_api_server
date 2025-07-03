import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrderLog, OrderLogDocument } from './entity/order-log.entity';
import { Model, Types } from 'mongoose';
import { CreateOrderLogDto } from './dto/orderlog-create.dto';

@Injectable()
export class OrderLogService {
    constructor(
        @InjectModel(OrderLog.name) private readonly orderLogModel: Model<OrderLogDocument>
    ) { }

    async createLog(dto: CreateOrderLogDto) {
        try {
            await this.orderLogModel.create({ ...dto })
        } catch (error) {
            throw error
        }

    }

    async getLatest(orderId:any):Promise<OrderLogDocument|null> {
        const data = await this.orderLogModel
            .findOne({ orderId: String(orderId) })
            .sort({ createdAt: -1 })
            .lean();
        return data
    }

}
