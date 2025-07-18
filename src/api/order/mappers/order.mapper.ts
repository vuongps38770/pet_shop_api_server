import { OrderLogDocument } from "src/api/order-log/entity/order-log.entity";
import { OrderDetailResDto, OrderRebuyItemDto, OrderRespondDto } from "../dto/order.respond";


export class OrderMapper {
    static toRespondDto(order: any,latestLog:OrderLogDocument|null): OrderRespondDto {
        const orderDetailItems: OrderDetailResDto[] = (order.orderDetailIds as any[]).map((detail: any): OrderDetailResDto => ({
            _id: detail._id?.toString(),
            productId: detail.productId?.toString(),
            variantId: detail.variantId?.toString(),
            productName: detail.productName,
            variantName: detail.variantName,
            image: detail.image,
            quantity: detail.quantity,
            sellingPrice: detail.sellingPrice,
            promotionalPrice: detail.promotionalPrice,
            
        }));

        return {
            _id: order._id?.toString(),
            userID: order.userID?.toString(),
            voucherID: order.voucherID?.toString(),
            shippingAddress: order.shippingAddress,
            totalPrice: order.totalPrice,
            paymentType: order.paymentType,
            status: order.status,
            expiredDate: order.expiredPaymentDate,
            orderDetailItems: orderDetailItems,
            shippingFree: order.shippingFee,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            productPrice: order.productPrice,
            sku: order.sku,
            paymentIds:order.paymentIds,
            latestLog:latestLog,
            discount:order.discount||undefined
        };
    }

    static toOrderRebuyItem(order:any): OrderRebuyItemDto[]{
        return order.orderDetailIds.map((orderItem:any): OrderRebuyItemDto=>{
            return{
                _id:orderItem._id,
                availableStock:orderItem.variantId.stock,
                image:orderItem.image,
                isActivate:orderItem.productId.isActivate,
                product_id:orderItem.productId._id,
                productName:orderItem.productId.name,
                productVariantId:orderItem.variantId._id,
                promotionalPrice:orderItem.variantId.promotionalPrice,
                sellingPrice:orderItem.variantId.sellingPrice,
                quantity:orderItem.quantity,
                variantName:orderItem.variantName
            }
        } )
    }
}