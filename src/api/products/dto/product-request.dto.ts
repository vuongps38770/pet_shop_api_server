
import { CreateProductDescriptionDto } from "./description-request.dto"

export class CreateProductDto {
    categories: string[]
    suppliers_id: string
    descriptions: CreateProductDescriptionDto[]
    name: string
    variantGroups:VariantGroupRequestDto[]

    variants: VariantRequestDto[]
    
}

export class VariantGroupRequestDto{
    groupName:string
    units:VariantUnitRequestDto[]
}
export class VariantUnitRequestDto{
    unitName:string
}
export class VariantRequestDto{
    sku:string
    stock:number
    unitValues:string[]
    importPrice:number
    sellingPrice:number
    promotionalPrice:number
}