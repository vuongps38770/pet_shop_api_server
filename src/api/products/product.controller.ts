import { Body, Controller, Get, Param, Post, Query, UploadedFiles, UseInterceptors } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/product-request.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProductAdminRespondSimplizeDto, ProductPaginationRespondDto, ProductRespondDto, ProductRespondSimplizeDto } from "./dto/product-respond.dto";
import { PaginationDto } from "./dto/product-pagination.dto";
import { UpdateProductDto, UpdateProductPriceDto } from "./dto/product-update.dto";
import { Public } from "../../decorators/public.decorator";

@Controller('products')
export class ProductController {
    constructor(
        private readonly productService: ProductService
    ) {
    }
    @Public()
    @Get('site')
    @Roles(UserRole.ADMIN, UserRole.USER)
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API Products';
    }
    @Public()
    @Post('create')
    @UseInterceptors(FileInterceptor('image'))
    async createProduct(@Body() req: CreateProductDto, @UploadedFiles() files: Express.Multer.File[]): Promise<PartialStandardResponse<ProductRespondDto>> {
        const data = await this.productService.createProduct(req, files)
        return {
            code: 201,
            message: "created",
            data: data,
        }
    }


    @Public()
    @Get("getProduct/:id")
    async getProductById(@Param('id') id: string): Promise<PartialStandardResponse<ProductRespondDto>> {
        const data = await this.productService.getProductById(id)
        return {
            code: 200,
            data: data,
            message: "1235 anh co danh roi nhip lao ko"
        }
    }
    @Public()
    @Get("getProducts")
    async getProducts(@Query() paginationDto: PaginationDto): Promise<PartialStandardResponse<ProductPaginationRespondDto<ProductRespondSimplizeDto>>> {
        const data = await this.productService.findAll(paginationDto)
        return {
            code: 200,
            data: data,
            message: "1235 anh co danh roi nhip lao ko"
        }
    }
    @Public()
    @Get("/admin/getProducts")
    async getProductsAdmin(@Query() paginationDto: PaginationDto): Promise<PartialStandardResponse<ProductPaginationRespondDto<ProductAdminRespondSimplizeDto>>> {
        const data = await this.productService.findAllForAdmin(paginationDto)
        return {
            code: 200,
            data: data,
            message: "1235 anh co danh roi nhip lao ko"
        }
    }
    @Public()
    @Post("update-basic-info/:id")
    async updateProductBasicInfo(@Body() data: UpdateProductDto, @Param() id: string): Promise<PartialStandardResponse<ProductRespondDto>> {
        const resData = await this.productService.editProductBasicInfo(id, data)
        return {
            code: 200,
            data: resData,
            message: "Update success"
        }
    }
    @Public()
    @Post("/admin/updatePrice")
    async updateProductPrices(@Body("productId") productId: string, @Body() dto: UpdateProductPriceDto): Promise<PartialStandardResponse<ProductRespondDto>> {
        const data = await this.productService.editManyProductvariantPrice(productId, dto.variants)
        return {
            code: 200,
            data,

        }
    }


}