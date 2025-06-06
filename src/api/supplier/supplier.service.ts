import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Supplier } from "./entity/supplier.entity";
import { Model } from "mongoose";
import { SupplierDto } from "./dto/supplier.dto";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Injectable()
export class SupplierService {

    constructor(
        @InjectModel('supplier') private readonly supplierModel: Model<Supplier>,
        private readonly cloudinaryService: CloudinaryService,
    ) {
    }
    async addSupplier(supplier: SupplierDto, image: Express.Multer.File): Promise<Supplier> {
        if (!supplier.name) {
            throw new Error("Supplier Name is Missing")
        }
        let img = ""
        if (image) {
            img = await this.cloudinaryService.uploadImage(image)
        }
        const newSupplier = new this.supplierModel({
            ...supplier,
            image: img
        });
        return newSupplier.save();
    }

    async getSupplierById(id: string): Promise<Supplier | null> {
        return this.supplierModel.findById(id).exec();
    }
    async getAllSupplier(): Promise<Supplier[]> {
        return this.supplierModel.find().exec();
    }
    async updateSupplier(id: string, data: SupplierDto, image: Express.Multer.File): Promise<Supplier> {
        let img = ""
        if (image) {
            img = await this.cloudinaryService.uploadImage(image)
        }
        if (img) {
            const supli = await this.supplierModel.findByIdAndUpdate(id, {
                name: data.name,
                description: data.description,
                updatedAt: new Date(),
                image:img
            }, { new: true }).exec();
            if (!supli) {
                throw new Error('Notfound supplier');
            }
            return supli;
        }
        const supli = await this.supplierModel.findByIdAndUpdate(id, {
            name: data.name,
            description: data.description,
            updatedAt: new Date()
        }, { new: true, runValidators:true }).exec();
        if (!supli) {
            throw new Error('Notfound supplier');
        }
        return supli;
    }


    // async deleteSupplier(id: string): Promise<supplier|null> {
    //     // check if supplier is used in products
    //     const supplier = await this.supplierModel.findById(id).exec();

    // }
}