import { CartRespondDto } from "../dto/cart-repspond-respond.dto";

export class CartRespondMapper {


    static todo(cart: any): CartRespondDto {
        return {
            _id: cart?._id,
            images: cart?.productVariantId?.productId?.images || [],
            isActivate: cart?.productVariantId?.productId?.isActivate ?? false,
            isOutOfStock: (cart?.productVariantId?.stock ?? 0) < (cart?.quantity ?? 0),
            productName: cart?.productVariantId?.productId?.name || '',
            productVariantId: cart?.productVariantId?._id,
            promotionalPrice: cart?.productVariantId?.promotionalPrice ?? 0,
            sellingPrice: cart?.productVariantId?.sellingPrice ?? 0,
            quantity: cart?.quantity ?? 0,
            product_id:cart?.productVariantId?.productId?._id
        }
    }
}