import { Body, Controller, Get, HttpCode, Injectable, Post, Query, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";
import { In, Raw } from "typeorm";
import { SupplierService } from "./supplier.service";
import { SupplierDto } from "./dto/supplier.dto";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { Supplier } from "./entity/supplier.entity";
import { RawResponse } from "src/decorators/raw.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../../decorators/public.decorator";
import { ParseJsonPipe } from "src/decorators/parse-json-pipe.interceptor";

@Controller('supplier')
export class SupplierController {
    constructor(
        private readonly categoryService: SupplierService
    ) {
    }
    @Roles(UserRole.ADMIN)
    @Get('site')
    @RawResponse()
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API supplier';
    }

    @Post('create')
    @HttpCode(201)
    @UseInterceptors(FileInterceptor('image'))
    @Public()
    async createSupplier(@Body("data", ParseJsonPipe<SupplierDto>) data: SupplierDto, @UploadedFile() file: Express.Multer.File): Promise<PartialStandardResponse<null>> {
        await this.categoryService.addSupplier(data, file);
        return {
            message: "Created supplier!",
            code: 201,
        }
    }

    @Public()
    @Get('get-all')
    async getAllSuppliers(): Promise<PartialStandardResponse<Supplier[]>> {
        const data = await this.categoryService.getAllSupplier();
        return {
            data
        }
    }


    @Post('update')
    @Public()
    @UseInterceptors(FileInterceptor('image'))
    async updateSupplier(
        @Query('id') id: string,
        @Body("data", ParseJsonPipe<SupplierDto>) dataUpdate: SupplierDto,
        @UploadedFile() file: Express.Multer.File
    ): Promise<PartialStandardResponse<Supplier>> {
        const dataRes = await this.categoryService.updateSupplier(id, dataUpdate, file)
        return {
            data: dataRes,
            message: "Update succesfully"
        }
    }

}