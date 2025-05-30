import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProductVariant } from "./entity/product-variant.entity";
import { CreateVariantDto } from "./dto/product-variant.dto";

@Injectable()
export class ProductVariantService{
    constructor(
        @InjectModel('ProductVariant') private readonly productVariantModel:Model<ProductVariant>
    ){}


    async create(data: CreateVariantDto): Promise<ProductVariant> {
        const created = new this.productVariantModel(data);
        return created.save();
    } 

    async update(id: string, data: Partial<ProductVariant>): Promise<ProductVariant> {
        const updated = await this.productVariantModel.findByIdAndUpdate(id, data, { new: true }).exec();
        if (!updated) {
            throw new NotFoundException(`ProductVariant with id ${id} not found`);
        }
        return updated;
    }
}