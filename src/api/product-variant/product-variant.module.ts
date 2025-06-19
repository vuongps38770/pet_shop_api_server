import { Module } from "@nestjs/common";
import { ProductVariantController } from "./product-variant.controller";
import { Mongoose } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductVariantSchema } from "./entity/product-variant.entity";
import { ProductVariantService } from "./product-variant.service";
import { VariantUnitModule } from "../variant-units/variant-unit.module";
import { VariantGroupModule } from "../variant-group/variant-group.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";


@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name:"ProductVariant",
                schema:ProductVariantSchema
            },

        ]),
        
    ],
    controllers: [ProductVariantController],
    providers: [ProductVariantService],
    exports: [ProductVariantService],

})
export class ProductVariantModule {}