import { Body, Controller, Delete, Get, Post } from "@nestjs/common";
import { CurrentUserId } from "src/decorators/current-user-id.decorator";
import { CartService } from "./cart.service";
import { CartRequestCreateDto } from "./dto/cart-request-create.dto";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";
import { CartRespondDto } from "./dto/cart-repspond-respond.dto";

@Controller("cart")
export class CartController {
    constructor(
        private readonly cartService: CartService
    ) { }

    @Post('add-to-cart')
    async addToCart(@CurrentUserId() usId: string, @Body() cartDto: CartRequestCreateDto): Promise<PartialStandardResponse<CartRespondDto[]>> {
        const res = await this.cartService.addToCart(usId, cartDto)
        return {
            code: 200,
            message: "Added succesfully!",
            data: res
        }
    }

    @Get('get-cart')
    async getCart(@CurrentUserId() usId: string): Promise<PartialStandardResponse<CartRespondDto[]>> {
        const data = await this.cartService.getCart(usId)
        return {
            code: 200,
            data,

        }
    }
    @Delete("remove")
    async removeFromCart(@CurrentUserId() usId: string, @Body("cartId") cartId: string): Promise<PartialStandardResponse<CartRespondDto[]>> {
        const data = await this.cartService.removeFromCart(usId, cartId);
        return {
            code: 200,
            message: "Succesfully remove from cart",
            data
        }
    }


    @Post("update-item-quantity")
    async updateQuantity(@Body("carrtId") carrtId: string, @Body("quantity") quantity: number) {
        await this.updateQuantity(carrtId, quantity)
    }

}