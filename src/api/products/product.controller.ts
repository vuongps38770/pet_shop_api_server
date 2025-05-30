import { Body, Controller, Get, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { Product } from "./entity/product.entity";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/product-request.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('products')
export class ProductController {
    constructor(
        private readonly productService:ProductService
    ) { 
    }

    @Get('site')
    @Roles(UserRole.ADMIN, UserRole.USER)
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API Products';
    }

    @Post('create')
    @UseInterceptors(FileInterceptor('image'))
    async createProduct(@Body() req:CreateProductDto,@UploadedFiles() files: Express.Multer.File[] ):Promise<PartialStandardResponse<Product>> {
        const data = await this.productService.createProduct(req,files)
        return {
            code:201,
            message:"created",
            data,
        }
    }
}