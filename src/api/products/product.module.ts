import { Module } from "@nestjs/common";
import { ProductController } from "./product.controller";
import { Mongoose } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductSchema } from "./entity/product.entity";
import { ProductDescriptionSchema } from "./entity/description.entity";
import { ProductService } from "./product.service";
import { VariantUnitModule } from "../variant-units/variant-unit.module";
import { VariantGroupModule } from "../variant-group/variant-group.module";
import { CloudinaryModule } from "src/cloudinary/cloudinary.module";
import { ProductVariantModule } from "../product-variant/product-variant.module";


@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name:"Product",
                schema:ProductSchema
            },
            {
                name:"productDescription",
                schema:ProductDescriptionSchema
            },

        ]),
        VariantUnitModule,
        VariantGroupModule,
        CloudinaryModule,
        ProductVariantModule
    ],
    controllers: [ProductController],
    providers: [ProductService],
    exports: [ProductService],

})
export class ProductModule {}