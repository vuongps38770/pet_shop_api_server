import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AddressService } from "./address.service";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";
import { DistrictDto, ProvinceDto, WardsDto } from "./dto/location-respond.dto";
import { Public } from "src/decorators/public.decorator";
import { CurrentUserId } from "src/decorators/current-user-id.decorator";
import { AddressCreateRequestDto, AddressEditRequestDto } from "./dto/address-request.dto";
import { Types } from "mongoose";

@Controller("address")
export class AddressController {
    constructor(
        private readonly addressService: AddressService
    ) { }
    @Public()
    @Get("all-province")
    async getAllProvince(): Promise<PartialStandardResponse<ProvinceDto[]>> {
        const data = await this.addressService.getProvinceList()
        return {
            data,
            code: 200
        }
    }

    @Public()
    @Get("districts")
    async getDistrictsByProvinceCode(@Query("provice-code") code: string | number): Promise<PartialStandardResponse<DistrictDto[]>> {
        const data = await this.addressService.getDistrictListByProvinceId(code)
        return {
            data,
            code: 200
        }
    }

    @Public()
    @Get("wards")
    async getWardsByDistrictCode(@Query("districts-code") code: string | number): Promise<PartialStandardResponse<WardsDto[]>> {
        const data = await this.addressService.getWardListByDistrictId(code)
        return {
            data,
            code: 200
        }
    }

    @Post('create-address')
    async createAddress(@CurrentUserId() usId: string,@Body() dto: AddressCreateRequestDto): Promise<PartialStandardResponse<any>> {
        const data = await this.addressService.createAddress(usId, dto)
        return {
            data
        }
    }
    @Get('my')
    async getMyAddresses(@CurrentUserId() usId: string): Promise<PartialStandardResponse<any>> {
        const data = await this.addressService.getAddressByUserId(usId);
        return { data, code: 200 };
    }
    @Post('edit')
    async editAddress(
        @CurrentUserId() usId: string,
        @Body() dto: AddressEditRequestDto
    ): Promise<PartialStandardResponse<any>> {
        const data = await this.addressService.editAdress(usId, dto);
        return { data, code: 200 };
    }
    @Delete('delete/:id')
    async deleteAddress(
        @CurrentUserId() usId: string,
        @Param('id') addressId: string
    ): Promise<PartialStandardResponse<any>> {
        const data = await this.addressService.deleteAddress(usId, addressId);
        return { data, code: 200 };
    }
    @Patch('set-default/:id')
    async setDefaultAddress(
        @CurrentUserId() usId: string,
        @Param('id') addressId: string
    ): Promise<PartialStandardResponse<any>> {
        const data = await this.addressService.setAddressAsDefault(new Types.ObjectId(usId), addressId);
        return { data, code: 200 };
    }
}