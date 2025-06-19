import { OrderDetailCreateDto } from "src/common/dto/order-detail-req.dto";

export class VariantMapper {


    static toOrder(variant: any, quantity: number, variantId: string): OrderDetailCreateDto {
        let variantName = '';
        if (variant?.variantUnits_ids && Array.isArray(variant.variantUnits_ids)) {
            variantName = variant.variantUnits_ids.map((unit: any) => unit.name).join(' - ');
        }
        return {
            productId: variant?.productId?._id || "unknown",
            productName: variant?.productId?.name || "unknown",
            quantity: quantity,
            sellingPrice: variant?.sellingPrice || 9999999999,
            variantId: variantId,
            image: variant?.productId?.images[0] || "",
            promotionalPrice: variant?.promotionalPrice || 9999999999,
            variantName:variantName
        }
    }
}