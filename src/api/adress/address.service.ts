import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Address } from "./entity/address.entity";
import axios from "axios";
import { DistrictDto, ProvinceDto } from "./dto/location-respond.dto";
import { AddressMapper } from "./mappers/location.mapper";
import { AddressCreateRequestDto, AddressEditRequestDto } from "./dto/address-request.dto";
import https from 'https';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AddressService {
    private ADDRESS_API_URL: string;
    constructor(
        @InjectModel("Address") private readonly addressModel: Model<Address>,
        private readonly configService: ConfigService
    ) { this.ADDRESS_API_URL = this.configService.getOrThrow<string>('PROVINCE_URL'); }


    async getProvinceList() {
        try {
            // const httpsAgent = new https.Agent({ rejectUnauthorized: false });
            const res = await axios.get(this.ADDRESS_API_URL + "p/", {
                //   httpsAgent,
            })
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
            userId: new Types.ObjectId(userId),
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
            const result = await this.addressModel.deleteOne({
                _id: new Types.ObjectId(addressId),
                userId: new Types.ObjectId(userId)
            });
            return result.deletedCount > 0;
        } catch (error) {
            throw error;
        }
    }

    async getAddressByUserId(usId: string) {
        try {
            const res = await this.addressModel.find({ userId: new Types.ObjectId(usId) })
            return res
        } catch (error) {
            throw error;
        }
    }

    async editAdress(usId: string, dto: AddressEditRequestDto) {
        try {
            const updated = await this.addressModel.findOneAndUpdate(
                { _id: dto._id, userId: new Types.ObjectId(usId) },
                { $set: { ...dto } },
                { new: true }
            );
            return updated;
        } catch (error) {
            throw error;
        }
    }

}