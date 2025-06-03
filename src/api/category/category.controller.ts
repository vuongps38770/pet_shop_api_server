import { Body, Controller, Get, HttpCode, Injectable, Param, Post, Query, Res } from "@nestjs/common";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { In, Raw } from "typeorm";
import { CategoryService } from "./category.service";
import { CategoryRequestCreateDto, CategoryRequestEditDto } from "./dto/category.dto";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { Category } from "./entity/category.entity";
import { RawResponse } from "src/decorators/raw.decorator";
import { CategoryType } from "./models/category-.enum";
import { Public } from "../../decorators/public.decorator";

@Controller('category')
export class CategoryController {
    constructor(
        private readonly categoryService: CategoryService
    ) {
    }

    @Public()
    @Get('site')
    @RawResponse()
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API category';
    }

    @Post('create')
    @Public()
    @HttpCode(201)
    async createCategory(@Body() res: CategoryRequestCreateDto): Promise<PartialStandardResponse<Category>> {
        const data = await this.categoryService.addCategory(res);
        return {
            message: "Created category!",
            code: 201,
            data: data
        }
    }
    @Public()
    @Get('get-all')
    async getAllCategories(): Promise<PartialStandardResponse<Category[]>> {
        const data = await this.categoryService.getAllCategories();
        return {
            data
        }
    }
    @Public()
    @Post('update-name')
    async updateCategory(@Body() dataUpdate: CategoryRequestEditDto): Promise<PartialStandardResponse<Category>> {
        const dataRes = await this.categoryService.updateCategory(dataUpdate)
        return {
            data: dataRes,
            message: "Update succesfully"
        }
    }
    @Public()
    @Get('get-categories')
    async getCategoryByType(@Query('type') type: CategoryType): Promise<PartialStandardResponse<Category[]>> {
        const dataRes = await this.categoryService.getCategoriesByType(type)
        return {
            data: dataRes,
            message: "Succesfully"
        }
    }
}