import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OrderLog, OrderLogDocument } from './entity/order-log.entity';
import { Model, Types } from 'mongoose';
import { CreateOrderLogDto } from './dto/orderlog-create.dto';
import { log } from 'console';

@Injectable()
export class OrderLogService {
    constructor(
        @InjectModel(OrderLog.name) private readonly orderLogModel: Model<OrderLogDocument>
    ) { }

    async createLog(dto: CreateOrderLogDto) {
        const elog = await this.orderLogModel.findOne({action:dto.action,performed_by:dto.performed_by,orderId:dto.orderId})
        if(elog){
            log(elog)
            return
        }
        try {
            await this.orderLogModel.create({ ...dto })
        } catch (error) {
            throw error
        }

    }

    async getLatest(orderId:any):Promise<OrderLogDocument|null> {
        const data = await this.orderLogModel
            .findOne({ orderId: new Types.ObjectId(String(orderId)) })
            .sort({ createdAt: -1 })
            .lean();
        return data
    }
    
    async getAllOrderLogsByOrderId(orderId:string):Promise<OrderLogDocument[]> {
        const data = await this.orderLogModel
            .find({ orderId: new Types.ObjectId(orderId) })
            .sort({ createdAt: -1 })
            .lean();
        return data
    }

}
