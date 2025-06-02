export class UpdateProductDto {
    name?: string
    isActivate?: boolean
    categories?: string[]
    suppliers_id?: string
    images?: string[]
}

export class UpdateProductPriceDto {
    variants:UpdateProductVariantPriceDto[]
}
export class UpdateProductVariantPriceDto {
    variantId:string
    promotionalPrice: number
    sellingPrice: number
}