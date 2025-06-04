import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Address } from "./entity/address.entity";
import axios from "axios";
import { DistrictDto, ProvinceDto } from "./dto/location-respond.dto";
import { AddressMapper } from "./mappers/location.mapper";
import { AddressCreateRequestDto, AddressEditRequestDto } from "./dto/address-request.dto";

@Injectable()
export class AddressService {
    constructor(
        @InjectModel("Address") private readonly addressModel: Model<Address>
    ) { }
    private readonly ADDRESS_API_URL = "https://provinces.open-api.vn/api/";

    async getProvinceList() {
        try {
            const res = await axios.get(this.ADDRESS_API_URL + "p/")
            return res.data.map((item: any) =>
                AddressMapper.toStandardProvince(item)
            ) as ProvinceDto[];
        } catch (error) {
            throw error
        }

    }

    async getDistrictListByProvinceId(provinceId: number | string): Promise<DistrictDto[]> {

        try {
            const res = await axios.get(`${this.ADDRESS_API_URL}p/${provinceId}?depth=2`)

            const districts = res.data?.districts ?? [];
            const data: DistrictDto[] = districts.map((item: any): DistrictDto => AddressMapper.toStandardDistrict(item));
            return data
        } catch (error) {
            throw error
        }

    }


    async getWardListByDistrictId(districtId: number | string): Promise<DistrictDto[]> {

        try {
            const res = await axios.get(`${this.ADDRESS_API_URL}d/${districtId}?depth=2`)

            const ward = res.data?.wards ?? [];
            const data: DistrictDto[] = ward.map((item: any): DistrictDto => AddressMapper.toStandardWard(item));

            return data
        } catch (error) {
            throw error
        }

    }


    async createAddress(userId: string, dto: AddressCreateRequestDto) {
        const address = await this.addressModel.create({
            userId: userId,
            ...dto
        })

        return address
    }

    async setAddressAsDefault(userId: string, addressId: string) {
        try {

            await this.addressModel.updateMany(
                { userId: userId, isDefault: true },
                { $set: { isDefault: false } }
            );


            const updated = await this.addressModel.findOneAndUpdate(
                { _id: addressId, userId: userId },
                { $set: { isDefault: true } },
                { new: true }
            );

            return updated;
        } catch (error) {
            throw error;
        }
    }

    async deleteAddress(userId: string, addressId: string) {
        try {
            const result = await this.addressModel.deleteOne({ _id: addressId, userId: userId });
            return result.deletedCount > 0;
        } catch (error) {
            throw error;
        }
    }

    async getAddressByUserId(usId:string){
        try {
            const res = await this.addressModel.find({userId:usId})
            return res
        } catch (error) {
            throw error;
        }
    }

    async editAdress(usId:string,dto:AddressEditRequestDto){
        try {
        const updated = await this.addressModel.findOneAndUpdate(
            { _id: dto._id, userId: usId },
            { $set: { ...dto } },
            { new: true }
        );
        return updated;
    } catch (error) {
        throw error;
    }
    }

}