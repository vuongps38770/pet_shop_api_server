import { Module } from "@nestjs/common";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { MongooseModule } from "@nestjs/mongoose";
import { CategorySchema } from "./entity/category.entity";

@Module({
    imports: [MongooseModule.forFeature([
        {
            name:"category",
            schema:CategorySchema
        }
    ])],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService],
})
export class CategoryModule {}