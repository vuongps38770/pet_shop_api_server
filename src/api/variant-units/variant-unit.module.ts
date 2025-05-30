import { Module } from "@nestjs/common";
import { ProductController } from "./variant-unit.controller";
import { Mongoose } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import { VariantUnitSchema } from "./entity/variant-unit";
import { VariantUnitService } from "./variant-unit.service";



@Module({
    imports: [
        MongooseModule.forFeature([

            {
                name:"VariantUnit",
                schema:VariantUnitSchema
            },
        ])
    ],
    controllers: [],
    providers: [VariantUnitService],
    exports: [VariantUnitService],

})
export class VariantUnitModule {}