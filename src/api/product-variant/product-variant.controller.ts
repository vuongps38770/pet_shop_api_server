import { Body, Controller, Get } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { Public } from "../../decorators/public.decorator";
import { ProductVariantService } from "./product-variant.service";

@Controller('product-variant')
export class ProductVariantController {
    constructor(
        private readonly productVariantService:ProductVariantService
    ) {
    }
    @Get('site')
    @Roles(UserRole.ADMIN, UserRole.USER)
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API Products';
    }

    @Get('test')
    async get(@Body()body:{variantId:string,quantity:number}){
        await this.productVariantService.getOrderDetailByOrderReqItem(body.variantId,body.quantity)
    }
}