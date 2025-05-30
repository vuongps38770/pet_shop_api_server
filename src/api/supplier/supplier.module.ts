import { Module } from "@nestjs/common";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { MongooseModule } from "@nestjs/mongoose";
import { SupplierSchema } from "./entity/supplier.entity";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: "supplier",
                schema: SupplierSchema
            }
        ]),
        CloudinaryModule
    ],
    controllers: [SupplierController],
    providers: [SupplierService],
    exports: [SupplierService],
})
export class SupplierModule { }