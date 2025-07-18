import { OrderLogDocument } from "src/api/order-log/entity/order-log.entity";

export class OrderRespondDto {
    _id: string;
    userID: string;
    voucherID?: string;
    shippingAddress: {
        refId: string;
        province: string;
        district: string;
        ward: string;
        streetAndNumber: string;
        lat?: number;
        lng?: number;
        receiverFullname: string;
    };
    


    paymentType: string;
    status: string;
    expiredDate?: Date;
    orderDetailItems: OrderDetailResDto[];
    shippingFree: number
    productPrice: number
    totalPrice: number;
    createdAt:Date;
    updatedAt:Date;
    sku:string;
    paymentIds:string[]
    latestLog:OrderLogDocument|null
    discount?:number
}

export class OrderDetailResDto {
    _id: string;
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    image?: string;
    quantity: number;
    sellingPrice: number;
    promotionalPrice?: number;
    stock?:number
}


export class OrderListResDto {
    total: number;
    page: number;
    limit: number;
    data: OrderRespondDto[];
    hasNext: boolean;
    hasPrevious: boolean;
}


export type OrderCheckoutResDto={
    orderId: string,
    paymentMethod:string, 
    payment?: any
}   

export type OrderRebuyItemDto = {
    _id:string
    productVariantId: string
    variantName:string
    productName:string
    quantity: number
    availableStock:number
    isActivate:boolean
    image:string
    promotionalPrice:number
    sellingPrice:number
    product_id:string
}
