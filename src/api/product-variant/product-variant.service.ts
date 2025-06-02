import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { ProductVariant } from "./entity/product-variant.entity";
import { CreateVariantDto } from "./dto/product-variant.dto";
import { UpdateProductVariantPriceDto } from "../products/dto/product-update.dto";

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
        if(!res){
            throw new NotFoundException("Not Found")
        }
    }
}