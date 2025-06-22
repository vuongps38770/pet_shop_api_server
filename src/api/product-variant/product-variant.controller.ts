import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { Public } from "../../decorators/public.decorator";
import { ProductVariantService } from "./product-variant.service";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";
import { ProductVariant } from "./entity/product-variant.entity";
import { VariantRespondDto } from "src/api/products/dto/product-respond.dto";
import { StockHistoryResDto } from "src/api/stock-history/dto/stock-history-res.dto";
import { VariantWithStockHistoryDto } from "./dto/variant-with-stock-history.dto";

@Controller('product-variant')
export class ProductVariantController {
    constructor(
        private readonly productVariantService: ProductVariantService
    ) {
    }
    @Get('site')
    @Roles(UserRole.ADMIN, UserRole.USER)
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API Products';
    }

    @Get('test')
    async get(@Body() body: { variantId: string, quantity: number }) {
        await this.productVariantService.getOrderDetailByOrderReqItem(body.variantId, body.quantity)
    }
    
    @Get('by-product/:productId/with-stock-history')
    async getVariantsWithStockHistory(@Param('productId') productId: string): Promise<PartialStandardResponse<VariantWithStockHistoryDto[]>> {
        const data = await this.productVariantService.getVariantsWithStockHistoryByProductId(productId);
        return {
            data,
            code: 200
        };
    }

    @Post('increase-stock/:variantId')
    async increaseStock(
        @Param('variantId') variantId: string,
        @Body() body: { quantity: number; note?: string; actionBy?: string }
    ): Promise<PartialStandardResponse<VariantRespondDto>> {
        await this.productVariantService.increaseStockWithLog(
            variantId,
            body.quantity,
            body.note,
            body.actionBy
        );

        return {
            code: 200,
            message: 'Tăng tồn kho thành công'
        };
    }

    @Post('decrease-stock/:variantId')
    async decreaseStock(
        @Param('variantId') variantId: string,
        @Body() body: { quantity: number; note?: string; actionBy?: string }
    ): Promise<PartialStandardResponse<void>> {
         await this.productVariantService.decreaseStockWithLog(
            variantId,
            body.quantity,
            body.note,
            body.actionBy
        );

        return {
            code: 200,
            message: 'Giảm tồn kho thành công'
        };
    }
}