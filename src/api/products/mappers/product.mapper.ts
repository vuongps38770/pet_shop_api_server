// src/api/product/mappers/product.mapper.ts

import { CategoryRespondDto } from 'src/api/category/dto/category-respond.dto';
import { ProductRespondDto, VariantGroupRespondDto, VariantRespondDto, VariantUnitRespondDto, ProductDescriptionRespondDto, ProductPaginationRespondDto, ProductRespondSimplizeDto, ProductAdminRespondSimplizeDto } from '../dto/product-respond.dto';
import { log } from 'console';

export class ProductMapper {
    static toDto(product: any): ProductRespondDto {
        return {
            _id: product._id.toString(),
            name: product?.name||"",
            isActivate: product.isActivate,
            images: product.images || [],
            suppliers_id: product.suppliers_id?._id?.toString() || null,
            maxPromotionalPrice: product.maxPromotionalPrice,
            maxSellingPrice: product.maxSellingPrice,
            minPromotionalPrice: product.minPromotionalPrice,
            minSellingPrice: product.minSellingPrice,
            categories: (product.categories_ids || []).map((cat: any): CategoryRespondDto => ({
                _id: cat._id.toString(),
                name: cat?.name||"",
                parentId: cat.parentId?.toString() || null,
                categoryType: cat.petType,
                isRoot: cat.isRoot

            })),

            descriptions: (product.descriptions || []).map((desc: any): ProductDescriptionRespondDto => ({
                title: desc.title,
                content: desc.content,
                index: desc.index,
            })),

            variants: (product.variantIds || []).map((v: any): VariantRespondDto => ({
                _id: v._id.toString(),
                sku: v.sku,
                stock: v.stock,
                importPrice: v.importPrice,
                sellingPrice: v.sellingPrice,
                promotionalPrice: v.promotionalPrice,
                unitValues: (v.variantUnits_ids || []).map((uv: any): VariantUnitRespondDto => ({
                    _id: uv._id.toString(),
                    unitName: uv?.name||"",
                })),
            })),

            variantGroups: ProductMapper.formatVariantGroups(product)
        };
    }


    private static formatVariantGroups(product: any) {

        const groupMap = new Map<string, {
            _id: string,
            groupName: string,
            units: { _id: string, unitName: string }[]
        }>();

        for (const variant of product.variantIds || []) {
            for (const unit of variant.variantUnits_ids || []) {
                const group = unit.variantGroupId;
                if (!group) continue;

                const groupId = group._id.toString();
                const groupName = group.name;

                if (!groupMap.has(groupId)) {
                    groupMap.set(groupId, {
                        _id: groupId,
                        groupName: groupName,
                        units: []
                    });
                }

                const groupEntry = groupMap.get(groupId)!;
                if (!groupEntry.units.some(u => u._id === unit._id.toString())) {
                    groupEntry.units.push({
                        _id: unit._id.toString(),
                        unitName: unit?.name||""
                    });
                }
            }
        }

        return Array.from(groupMap.values());
    }

    static mapToSimplize(product: any): ProductRespondSimplizeDto {
        return {
            _id: product._id,
            isActivate: product.isActivate,
            name: product?.name||"",
            images: product.images,
            maxPromotionalPrice: product.maxPromotionalPrice,
            maxSellingPrice: product.maxSellingPrice,
            minPromotionalPrice: product.minPromotionalPrice,
            minSellingPrice: product.minSellingPrice
        }
    }

    static mapToSimplizeAdmin(product: any): ProductAdminRespondSimplizeDto {
        return {
            _id: product._id,
            isActivate: product.isActivate,
            name: product?.name||"",
            images: product.images,
            maxPromotionalPrice: product.maxPromotionalPrice,
            maxSellingPrice: product.maxSellingPrice,
            minPromotionalPrice: product.minPromotionalPrice,
            minSellingPrice: product.minSellingPrice,
            supplier: product?.suppliers_id?.name||"",
            categories: (product.categories_ids || []).map((ca: any): CategoryRespondDto => ({
                _id: ca._id,
                name: ca?.name||"",

            }))
        }
    }

}

