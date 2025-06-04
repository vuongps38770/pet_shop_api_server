import { DistrictDto, ProvinceDto, WardsDto } from "../dto/location-respond.dto"

export class AddressMapper{
    static toStandardProvince=(province:any):ProvinceDto=>{
        return{
            code:province?.code||-1,
            name:province?.name||"",
            
        }
    }

    static toStandardDistrict=(district:any):DistrictDto=>{
        return{
            code:district.code,
            name:district.name,
        }
    }

    static toStandardWard=(ward:any):WardsDto=>{
        return{
            code:ward.code,
            name:ward.name
        }
    }
}