import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./entity/cart.entity";
import { CartRequestCreateDto } from "./dto/cart-request-create.dto";
import { error, log } from "console";
import { CartRespondDto } from "./dto/cart-repspond-respond.dto";
import { ProductService } from "../products/product.service";
import { CartRespondMapper } from "./mappers/cart-respond-mapper";


@Injectable()
export class CartService {
    constructor(
        @InjectModel("cart") private readonly cartModel: Model<Cart>,
        private readonly productSerVice: ProductService
    ) { }


    async addToCart(userId: string, cartdto: CartRequestCreateDto): Promise<Cart> {
        const existCart = await this.cartModel.findOne({ userId, productVariantId: cartdto.productVariantId })
        if (existCart) {
            throw new Error('This product already in your cart')
        }
        return await this.cartModel.create({
            productVariantId: cartdto.productVariantId,
            quantity: cartdto.quantity,
            userId: userId
        })
    }

    async getCart(userId: string): Promise<CartRespondDto[]> {
        const carts = await this.cartModel.find({ userId: userId })
            .populate(
                {
                    path: "productVariantId",
                    populate: ({
                        path: "productId"
                    })
                }
            )
        log(JSON.stringify(carts))
        return (carts || []).map((item) => CartRespondMapper.todo(item))
    }
    async removeFromCart(userId: string, cartId: string): Promise<void> {
        const result = await this.cartModel.deleteOne({ _id: cartId, userId })
        const res = result.deletedCount > 0;
        if (!res) {
            throw new Error("cart item not found!")
        }
    }
}