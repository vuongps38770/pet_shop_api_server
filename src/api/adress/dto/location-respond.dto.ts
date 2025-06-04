export class ProvinceDto{
    name:string
    code:string
    districts?:DistrictDto[]
}
export class DistrictDto{
    name:string
    code:string
    wards?:WardsDto[]
}

export class WardsDto{
    name:string
    code:string
}