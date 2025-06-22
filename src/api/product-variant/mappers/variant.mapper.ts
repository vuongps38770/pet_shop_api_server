import { VariantRespondDto, VariantUnitRespondDto } from "src/api/products/dto/product-respond.dto";
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
            variantName: variantName
        }
    }

    static toVariantRes(v: any): VariantRespondDto {
        return {
            _id: v._id.toString(),
            sku: v.sku,
            stock: v.stock,
            importPrice: v.importPrice,
            sellingPrice: v.sellingPrice,
            promotionalPrice: v.promotionalPrice,
            unitValues: (v.variantUnits_ids || []).map((uv: any): VariantUnitRespondDto => ({
                _id: uv._id.toString(),
                unitName: uv?.name || "",
            })),
        }

    }
}