import { Module } from "@nestjs/common";
import { ProductController } from "./variant-group.controller";
import { Mongoose } from "mongoose";
import { MongooseModule } from "@nestjs/mongoose";
import { VariantGroupSchema } from "./entity/variant-group";
import { VariantGroupService } from "./variant-group.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name:"VariantGroup",
                schema:VariantGroupSchema
            },

        ])
    ],
    controllers: [],
    providers: [VariantGroupService],
    exports: [VariantGroupService],

})
export class VariantGroupModule {}