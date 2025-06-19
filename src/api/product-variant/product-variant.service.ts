import { HttpCode, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { ProductVariant } from "./entity/product-variant.entity";
import { CreateVariantDto } from "./dto/product-variant.dto";
import { UpdateProductVariantPriceDto } from "../products/dto/product-update.dto";
import { AppException } from "src/common/exeptions/app.exeption";
import { HttpStatusCode } from "axios";
import { log } from "console";
import { VariantMapper } from "./mappers/variant.mapper";
import { OrderDetailCreateDto } from "src/common/dto/order-detail-req.dto";

@Injectable()
export class ProductVariantService implements OnModuleInit {
    constructor(
        @InjectModel('ProductVariant') private readonly productVariantModel: Model<ProductVariant>
    ) { }
    async onModuleInit() {
        console.log('Syncing indexes for ProductVariant collection...');
        await this.productVariantModel.syncIndexes();
        console.log('Indexes synced!');
    }

    async create(data: CreateVariantDto, session: ClientSession): Promise<ProductVariant> {
        const created = new this.productVariantModel(data);
        return created.save({ session });
    }

    async update(id: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
        const updated = await this.productVariantModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!updated) {
            throw new NotFoundException(`ProductVariant with id ${id} not found`);
        }
        return updated;
    }

    async updateProductId(variantId: string, productId: string, session: ClientSession) {
        return this.productVariantModel.updateOne(
            { _id: variantId },
            { $set: { productId: productId } },
            { session }
        );
    }
    async editProductvariantPrice(dto: UpdateProductVariantPriceDto) {
        const updateFields = Object.fromEntries(
            Object.entries(dto).filter(([key, value]) =>
                key !== 'variantId' && value !== undefined
            )
        );

        if (Object.keys(updateFields).length === 0) {
            return;
        }

        const res = await this.productVariantModel.findByIdAndUpdate(dto.variantId, updateFields);
        if (!res) {
            throw new NotFoundException("Not Found")
        }
    }


    async getOrderDetailByOrderReqItem(variantId: string, quantity: number): Promise<OrderDetailCreateDto> {
        await this.validateVariant(variantId, quantity)
        const orderDetail = await this.productVariantModel.findById(variantId)
            .populate([
                {
                    path: 'productId',
                    select:'_id name images'
                },
                {
                    path: 'variantUnits_ids',
                }
            ])
            .select('productId sellingPrice promotionalPrice quantity variantUnits_ids')
            .lean()
            .exec()
            
        const res= VariantMapper.toOrder(orderDetail,quantity,variantId)
        return res
    }

    private async validateVariant(variantId: string, quantity: number) {
        const variant = await this.productVariantModel.findById(variantId).populate({
            path: 'productId',
        }).exec();
        if (!variant) {
            throw new AppException('variant not found');
        }
        // const product: any = variant.productId;
        // if (!product || !product.isActivate) {
        //     throw new AppException('Product is not active');
        // }
        if (variant.stock < quantity) {
            throw new AppException('Mặt hàng đã hết hàng vui lòng mua lại!', HttpStatusCode.Conflict, 'OUT_OF_STOCK');
        }
    }

    async increaseStock(variantId: string, quantity: number): Promise<void> {
        await this.productVariantModel.findByIdAndUpdate(
            variantId,
            { $inc: { stock: quantity } },
            { new: true }
        );
    }

    async decreaseStock(variantId: string, quantity: number): Promise<void> {
        const res = await this.productVariantModel.findOneAndUpdate(
            { _id: variantId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
        );
        if (!res) {
            throw new AppException('Sản phẩm đã hết hàng hoặc không đủ số lượng!',409,'OUT_OF_STOCK');
        }
    }
}



