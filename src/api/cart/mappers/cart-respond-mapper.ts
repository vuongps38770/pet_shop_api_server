import { CartRespondDto } from "../dto/cart-repspond-respond.dto";

export class CartRespondMapper {


    static todo(cart: any): CartRespondDto {
        return {
            _id: cart?._id,
            images: cart?.productVariantId?.productId?.images || [],
            isActivate: cart?.productVariantId?.productId?.isActivate ?? false,
            availableStock:cart?.productVariantId?.stock ??0,
            productName: cart?.productVariantId?.productId?.name || '',
            productVariantId: cart?.productVariantId?._id,
            promotionalPrice: cart?.productVariantId?.promotionalPrice ?? 0,
            sellingPrice: cart?.productVariantId?.sellingPrice ?? 0,
            quantity: cart?.quantity ?? 0,
            product_id:cart?.productVariantId?.productId?._id,
            createdAt: cart?.createdAt,
            updatedAt: cart?.updatedAt,
            groups: cart?.productVariantId?.variantUnits_ids?.map((unit: any) => ({
                _id: unit?.variantGroupId?._id,
                name: unit?.variantGroupId?.name || '',
                unit: {
                    _id: unit?._id,
                    name: unit?.name || ''
                }
            })) || []
        }
    }
}