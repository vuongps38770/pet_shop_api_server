import { OrderDetailResDto, OrderRespondDto } from "../dto/order.respond";


export class OrderMapper {
    static toRespondDto(order: any): OrderRespondDto {
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
            createdDate: order.createdDate,
            productPrice: order.productPrice,
            sku:order.sku
        };
    }
}