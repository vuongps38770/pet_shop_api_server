import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { FavoriteService } from "./favorite.service";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";
import { CurrentUserId } from "src/decorators/current-user-id.decorator";
import { ProductService } from "../products/product.service";
import { ProductRespondDto, ProductRespondSimplizeDto } from "../products/dto/product-respond.dto";

@Controller("favorite")
export class FavoriteController {
    constructor(
        private readonly favoriteService: FavoriteService,
        private readonly productService:ProductService
    ) {

    }
    @Post("add-to-favorite")
    async addToFavorite(@CurrentUserId()usId:string,@Body("productId")productId:string):Promise<void>{
        await this.favoriteService.addToFavorite(usId,productId)
    }

    @Get('get-favorite-list-ids')
    async getCartListIds(@CurrentUserId() usId:string):Promise<PartialStandardResponse<string[]>>{
        const data= await this.favoriteService.getFavoriteListIds(usId)
        return{
            code:200,
            data
        }
    }

    @Delete('remove-from-favorite')
    async removeFromCart(@CurrentUserId()usId:string,@Body("productId")productId:string):Promise<void>{
        await this.favoriteService.removeFromFavorite(usId,productId)
    }

    @Post("get-favorite-list")
    async getProductList(@CurrentUserId()usId:string):Promise<PartialStandardResponse<ProductRespondSimplizeDto[]>>{
        const data = await this.favoriteService.getProductList(usId)
        return{
            data,
            code:200
        }
    }

}
