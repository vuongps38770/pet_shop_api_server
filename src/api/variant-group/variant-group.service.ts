import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, ClientSession } from "mongoose";
import { VariantGroup, VariantGroupSchema } from "./entity/variant-group";
import { VariantGroupCreateDto } from "./dto/variant-group-create.dto";

@Injectable()
export class VariantGroupService {
    constructor(
        @InjectModel(VariantGroup.name) private readonly variantGroupModel: Model<VariantGroup>
    ) { }

    async create(data: Partial<VariantGroupCreateDto>, session?: ClientSession): Promise<VariantGroup> {
        const created = new this.variantGroupModel(data);
        return session ? created.save({ session }) : created.save();
    }

    async findAll(): Promise<VariantGroupCreateDto[]> {
        return this.variantGroupModel.find().exec();
    }

    async findOne(id: string): Promise<VariantGroup> {
        const variantGroup = await this.variantGroupModel.findById(id).exec();
        if (!variantGroup) {
            throw new NotFoundException(`VariantGroup with id ${id} not found`);
        }
        return variantGroup;
    }

    async update(id: string, data: Partial<VariantGroupCreateDto>, session?: ClientSession): Promise<VariantGroup> {
        const updated = await this.variantGroupModel.findByIdAndUpdate(id, data, { new: true, session }).exec();
        if (!updated) {
            throw new NotFoundException(`VariantGroup with id ${id} not found`);
        }
        return updated;
    }

    async remove(id: string, session?: ClientSession): Promise<void> {
        const result = await this.variantGroupModel.findByIdAndDelete(id, { session }).exec();
        if (!result) {
            throw new NotFoundException(`VariantGroup with id ${id} not found`);
        }
    }
}