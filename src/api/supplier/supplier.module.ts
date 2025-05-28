import { Module } from "@nestjs/common";
import { SupplierController } from "./supplier.controller";
import { SupplierService } from "./supplier.service";
import { MongooseModule } from "@nestjs/mongoose";
import { SupplierSchema } from "./entity/supplier.entity";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: "supplier",
                schema: SupplierSchema
            }
        ]),
        
    ],
    controllers: [SupplierController],
    providers: [SupplierService, CloudinaryService],
    exports: [SupplierService],
})
export class SupplierModule { }