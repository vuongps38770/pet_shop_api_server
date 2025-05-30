import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import { VariantUnit } from "./entity/variant-unit";
import { VariantUnitDto } from "./dto/variant-unit.dto";

@Injectable()
export class VariantUnitService {
    constructor(
        @InjectModel(VariantUnit.name) private readonly variantUnitModel: Model<VariantUnit>
    ) { }

    async create(data: Partial<VariantUnitDto>, variantGroupId: string, session?: ClientSession): Promise<VariantUnit> {
        if (!variantGroupId) {
            throw new Error("variantGroupId is missing")
        }
        const created = new this.variantUnitModel({
            ...data,
            variantGroupId
        });
        return session ? created.save({ session }) : created.save();
    }

    async findAll(): Promise<VariantUnit[]> {
        return this.variantUnitModel.find().exec();
    }

    async findOne(id: string): Promise<VariantUnit> {
        const variantUnit = await this.variantUnitModel.findById(id).exec();
        if (!variantUnit) {
            throw new NotFoundException(`VariantUnit with id ${id} not found`);
        }
        return variantUnit;
    }

    async update(id: string, data: Partial<VariantUnit>, session?: ClientSession): Promise<VariantUnit> {
        const updated = await this.variantUnitModel.findByIdAndUpdate(id, data, { new: true, session }).exec();
        if (!updated) {
            throw new NotFoundException(`VariantUnit with id ${id} not found`);
        }
        return updated;
    }

    async remove(id: string, session?: ClientSession): Promise<void> {
        const result = await this.variantUnitModel.findByIdAndDelete(id, { session }).exec();
        if (!result) {
            throw new NotFoundException(`VariantUnit with id ${id} not found`);
        }
    }
}