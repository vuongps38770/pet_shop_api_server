import { Body, Controller, Get, Param, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/product-request.dto";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ProductAdminRespondSimplizeDto, ProductPaginationRespondDto, ProductRespondDto, ProductRespondSimplizeDto, ProductSuggestionDto, SuggestionType } from "./dto/product-respond.dto";
import { PaginationDto } from "./dto/product-pagination.dto";
import { UpdateProductDto, UpdateProductPriceDto } from "./dto/product-update.dto";
import { Public } from "../../decorators/public.decorator";
import { CurrentUser } from "src/decorators/curent-user.decorator";
import { CurrentUserId } from "src/decorators/current-user-id.decorator";

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
    @Post('create-test')
    @UseInterceptors(FilesInterceptor('images'))
    async createProductTest(@Body("data") dataString: string, @UploadedFiles() files: Express.Multer.File[]): Promise<PartialStandardResponse<ProductRespondDto>> {
        const req: CreateProductDto = JSON.parse(dataString);
        console.log(dataString);

        const data = await this.productService.createProduct(req, files)
        return {
            code: 201,
            message: "created",
            data: data,
        }
    }


    @Public()
    @Post('create')
    @UseInterceptors(FilesInterceptor('images'))
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

        }
    }
    @Public()
    @Get("getProducts")
    async getProducts(@Query() paginationDto: PaginationDto): Promise<PartialStandardResponse<ProductPaginationRespondDto<ProductRespondSimplizeDto>>> {
        const data = await this.productService.findAll(paginationDto)
        return {
            code: 200,
            data: data,
        }
    }
    @Public()
    @Get("admin/getProducts")
    async getProductsAdmin(@Query() paginationDto: PaginationDto): Promise<PartialStandardResponse<ProductPaginationRespondDto<ProductAdminRespondSimplizeDto>>> {
        const data = await this.productService.findAllForAdmin(paginationDto)
        return {
            code: 200,
            data: data,
        }
    }
    @Public()
    @Post("update-basic-info/:productId")
    async updateProductBasicInfo(@Body() data: UpdateProductDto, @Param("productId") id: string): Promise<PartialStandardResponse<ProductRespondDto>> {
        const resData = await this.productService.editProductBasicInfo(id, data)
        return {
            code: 200,
            data: resData,
            message: "Update success"
        }
    }

    @Public()
    @Post("admin/updatePrice")
    async updateProductPrices(@Body("productId") productId: string, @Body() dto: UpdateProductPriceDto): Promise<PartialStandardResponse<ProductRespondDto>> {
        const data = await this.productService.editManyProductvariantPrice(productId, dto.variants)
        return {
            code: 200,
            data,
        }
    }

    @Public()
    @Get("suggestions")
    async getProductSuggestions(
        @Query("type") type: string = SuggestionType.POPULAR,
        @Query("limit") limit?: string,
        @CurrentUserId() userId?: string
    ): Promise<PartialStandardResponse<ProductSuggestionDto[]>> {
        const limitNumber = limit ? parseInt(limit) : 10;

        // Validate suggestion type
        if (!Object.values(SuggestionType).includes(type as SuggestionType)) {
            return {
                code: 400,
                message: `Loại gợi ý không hợp lệ. Các loại có sẵn: ${Object.values(SuggestionType).join(', ')}`,
                data: []
            };
        }

        const data = await this.productService.getProductSuggestions(
            type as SuggestionType,
            userId,
            limitNumber
        );

        const typeMessages = {
            [SuggestionType.PERSONALIZED]: "Lấy danh sách sản phẩm cá nhân hóa thành công",
            [SuggestionType.POPULAR]: "Lấy danh sách sản phẩm phổ biến thành công"
        };

        return {
            code: 200,
            data: data,
            message: typeMessages[type as SuggestionType]
        };
    }

    @Get(":id/related")
    async getRelatedProduct(@Param("id") productId:string){
        const data = await this.productService.getRelatedProducts(productId)
    }

}