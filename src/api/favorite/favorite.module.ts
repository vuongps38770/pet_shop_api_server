import { Module } from "@nestjs/common";
import { FavoriteService } from "./favorite.service";
import { ProductService } from "../products/product.service";
import { AuthService } from "../auth/auth.service";
import { FavoriteController } from "./favorite.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { FavoriteSchema } from "./entity/favorite.entity";
import { ProductModule } from "../products/product.module";
import { AuthModule } from "../auth/auth.module";

@Module({
    controllers:[FavoriteController],
    exports:[FavoriteService],
    imports:[
        ProductModule,
        AuthModule,
        MongooseModule.forFeature([
            {
                name:"Favorite",
                schema:FavoriteSchema
            }
        ])
    ],
    providers:[
        FavoriteService
    ]
})
export class FavoriteModule{}