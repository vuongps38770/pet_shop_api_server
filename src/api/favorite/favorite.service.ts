import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Favorite } from "./entity/favorite.entity";
import { AppException } from "src/common/exeptions/app.exeption";
import { Product } from "../products/entity/product.entity";
import { ProductService } from "../products/product.service";
import { AuthService } from "../auth/auth.service";
import { ProductAdminRespondSimplizeDto, ProductRespondSimplizeDto } from "../products/dto/product-respond.dto";

@Injectable()
export class FavoriteService{
    constructor(
        @InjectModel("Favorite") private readonly favoriteModel:Model<Favorite>,
        private readonly productService:ProductService,
        private readonly userService:AuthService

    ){}

    private async validateUserAndProduct(userId:string,productId?:string){
        await this.userService.validateUser(userId)
        await this.productService.validateProduct(productId)
    }

    async addToFavorite(userId: string, productId: string): Promise<void> {
        await this.validateUserAndProduct(userId, productId);

        const existingFavorite = await this.favoriteModel.findOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId)
        });

        if (existingFavorite) {
            return;
        }

        await this.favoriteModel.create({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId)
        });
    }

    async removeFromFavorite(userId: string, productId: string): Promise<void> {
        await this.validateUserAndProduct(userId, productId);

        await this.favoriteModel.deleteOne({
            userId: new Types.ObjectId(userId),
            productId: new Types.ObjectId(productId)
        });
    }

    async removeAllFavorites(userId: string): Promise<void> {
        await this.validateUserAndProduct(userId);

        await this.favoriteModel.deleteMany({
            userId: new Types.ObjectId(userId)
        });
    }

    async getFavoriteListIds(userId: string): Promise<string[]> {
        await this.validateUserAndProduct(userId);

        const favorites = await this.favoriteModel.find({ 
            userId: new Types.ObjectId(userId) 
        });
        return favorites.map(fav => fav.productId.toString());
    }


    async getProductList(usId:string):Promise<ProductRespondSimplizeDto[]>{
        let res: ProductRespondSimplizeDto[] = [];
        const listId = await this.getFavoriteListIds(usId)
        if(!listId) return[]
        for(let id of listId){
            let product = await this.productService.getProductByIdAndSimpilize(id)
            res.push(product)
        }
        return res
    }
}