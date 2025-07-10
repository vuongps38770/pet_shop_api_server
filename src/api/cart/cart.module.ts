import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CartSchema } from "./entity/cart.entity";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { ProductModule } from "../products/product.module";
import { ProductVariantModule } from "../product-variant/product-variant.module";

@Module({
    controllers:[CartController],
    exports:[CartService],
    imports:[
        MongooseModule.forFeature([
            {
                name:"cart",
                schema:CartSchema
            }
        ]),
        ProductVariantModule
    ],
    providers:[CartService],
})
export class CartModule {}