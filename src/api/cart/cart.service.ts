import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Cart } from "./entity/cart.entity";
import { CartRequestCreateDto } from "./dto/cart-request-create.dto";
import { error, log } from "console";
import { CartRespondDto } from "./dto/cart-repspond-respond.dto";
import { ProductService } from "../products/product.service";
import { CartRespondMapper } from "./mappers/cart-respond-mapper";
import { AppException } from "src/common/exeptions/app.exeption";


@Injectable()
export class CartService {
    constructor(
        @InjectModel("cart") private readonly cartModel: Model<Cart>,
        private readonly productSerVice: ProductService
    ) { }


    async addToCart(userId: string, cartdto: CartRequestCreateDto): Promise<CartRespondDto[]> {
        const existCart = await this.cartModel.findOne({ userId, productVariantId: cartdto.productVariantId })
        if (existCart) {
            existCart.quantity =cartdto.quantity;
            if (existCart.quantity < 1) {
                throw new AppException("Invalid number for cart!", HttpStatus.BAD_REQUEST);
            }
            existCart.updatedAt = new Date();
            const updatedCart = await existCart.save();
            log("Updated cart:", JSON.stringify(updatedCart));
            const cartList = await this.getCart(userId);
            return cartList;
        }


        
        const newCart = await this.cartModel.create({
            productVariantId: cartdto.productVariantId,
            quantity: cartdto.quantity,
            userId: userId
        });

        if (!newCart) {
            throw new AppException("Failed to add to cart!", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const cartList = await this.getCart(userId);
        return cartList;
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
        // already checked if carts is out of stock in CartRespondMapper.todo ko hiểu thì lên gg mà dịch hẹ hẹ hẹ
        return (carts || []).map((item) => CartRespondMapper.todo(item))
    }


    async getCartById(cartId: string): Promise<CartRespondDto> {
        const cart = await this.cartModel.findById(cartId)
            .populate(
                {
                    path: "productVariantId",
                    populate: ({
                        path: "productId"
                    })
                }
            )
        if (!cart) {
            throw new AppException("Cart item not found!", HttpStatus.NOT_FOUND)
        }
        return CartRespondMapper.todo(cart);
    }
    async removeFromCart(userId: string, cartId: string): Promise<void> {
        const result = await this.cartModel.deleteOne({ _id: cartId, userId })
        const res = result.deletedCount > 0;
        if (!res) {
            throw new Error("cart item not found!")
        }
    }

    async updateQuantityCartItem(cartId: string, quantity: number) {
        if (quantity < 1) {
            throw new AppException("Invalid number for cart!")
        }
        const cartItem = await this.cartModel.findByIdAndUpdate(cartId, { quantity: quantity })
        if (!cartItem) {
            throw new AppException("Cart item not found!", HttpStatus.NOT_FOUND)
        }
    }
}