import { CategoryRespondDto } from "src/api/category/dto/category-respond.dto"


export class ProductRespondDto {
    _id:string
    name: string
    isActivate: boolean
    categories: CategoryRespondDto[]
    suppliers_id: string
    descriptions: ProductDescriptionRespondDto[]
    variantGroups: VariantGroupRespondDto[]
    variants: VariantRespondDto[]
    images:string[]
    minPromotionalPrice:number
    maxPromotionalPrice:number
    minSellingPrice:number
    maxSellingPrice:number
}

export class VariantGroupRespondDto{
    _id:string
    groupName:string
    units:VariantUnitRespondDto[]
}
export class VariantUnitRespondDto{
    _id:string
    unitName:string
}
export class VariantRespondDto{
    _id:string
    sku:string
    stock:number
    unitValues:VariantUnitRespondDto[]
    importPrice:number
    sellingPrice:number
    promotionalPrice:number
}

export class ProductDescriptionRespondDto{

    
    title:string

    content:string

    index:number
}


export class ProductPaginationRespondDto {
    data: ProductRespondSimplizeDto[]; 
    total: number;             
    page: number;              
    limit: number;             
    totalPages: number;        
    hasNextPage: boolean;    
    hasPreviousPage: boolean;  
}

export class ProductRespondSimplizeDto {
    _id:string
    name: string
    isActivate: boolean
    images:string[]
    minPromotionalPrice:number
    maxPromotionalPrice:number
    minSellingPrice:number
    maxSellingPrice:number
}