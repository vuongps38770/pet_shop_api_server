export class CartRespondDto {
    _id:string
    productVariantId: string
    quantity: number
    availableStock:number
    isActivate:boolean
    images:string[]
    promotionalPrice:number
    sellingPrice:number
    productName:string
    product_id:string
    groups:{
        _id:string
        name:string
        unit:{
            _id:string
            name:string
        }
    }[]
    createdAt: Date
    updatedAt: Date
}

