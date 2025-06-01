import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product } from "./entity/product.entity";
import { CreateProductDto, VariantGroupRequestDto } from "./dto/product-request.dto";
import { VariantUnit } from "../variant-units/entity/variant-unit";
import { VariantGroup } from "../variant-group/entity/variant-group";
import { VariantGroupService } from "../variant-group/variant-group.service";
import { VariantUnitService } from "../variant-units/variant-unit.service";
import { ProductVariantService } from "../product-variant/product-variant.service";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { log } from "console";
import { ProductPaginationRespondDto, ProductRespondDto } from "./dto/product-respond.dto";
import { ProductMapper } from "./mappers/product.mapper";
import { PaginationDto } from "./dto/product-pagination.dto";

@Injectable()
export class ProductService {
    constructor(
        @InjectModel("Product") private readonly productModel: Model<Product>,
        private readonly variantGroupService: VariantGroupService,
        private readonly variantUnitService: VariantUnitService,
        private readonly variantService: ProductVariantService,
        private readonly cloudinaryService: CloudinaryService

    ) { }




    async createProduct(data: CreateProductDto, imageFiles: Express.Multer.File[]): Promise<ProductRespondDto> {
        if (!data) {
            throw new BadRequestException('Dữ liệu sản phẩm không được để trống');
        }

        if (!data.variantGroups || !Array.isArray(data.variantGroups) || data.variantGroups.length === 0) {
            throw new BadRequestException('Danh sách nhóm biến thể không hợp lệ');
        }

        if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
            throw new BadRequestException('Danh sách biến thể không hợp lệ');
        }



        let createdGroups: VariantGroup[] = [];
        let variantGroups = data.variantGroups;
        const unitMap: Map<string, string> = new Map();

        //save groups like size/corlor/flavor/...etc
        for (let i = 0; i < variantGroups.length; i++) {
            let group = variantGroups[i]
            const savedGroup = await this.variantGroupService.create({
                name: variantGroups[i].groupName
            })
            createdGroups.push(savedGroup)


            for (let unit of group.units) {
                const savedUnit = await this.variantUnitService.create({
                    name: unit.unitName,
                }, savedGroup._id)
                unitMap.set(`${savedGroup.name}-${unit.unitName}`, savedUnit._id);

            }
        }


        const savedVariantsIds: string[] = [];
        for (const variant of data.variants) {
            const unitIds: string[] = [];

            for (let i = 0; i < variant.unitValues.length; i++) {
                const group = createdGroups[i];
                const value = variant.unitValues[i];
                const key = `${group.name}-${value}`;
                const unitId = unitMap.get(key);
                if (!unitId) {
                    throw new Error(`Không tìm thấy unit với key: ${key}`);
                }
                unitIds.push(unitId);

            }

            const savedVariant = await this.variantService.create({
                sku: variant.sku,
                stock: variant.stock,
                variantUnits_ids: unitIds,
                importPrice: variant.importPrice,
                promotionalPrice: variant.promotionalPrice,
                sellingPrice: variant.sellingPrice

            });

            savedVariantsIds.push(savedVariant._id);

        }
        let imageUrls: string[] = []
        if (imageFiles) {
            const images = await this.cloudinaryService.uploadMultiple(imageFiles)
            if (!images) {
                throw new Error(`Lỗi khi upload ảnh`);
            }
            imageUrls = images
        }
        log(savedVariantsIds)
        const createdProduct = await this.productModel.create({
            name: data.name,
            variantIds: savedVariantsIds,
            categories_ids: data.categories,
            descriptions: data.descriptions,
            images: imageUrls,
            suppliers_id: data.suppliers_id,

        });

        return await this.getProductById(createdProduct._id.toString())

    }


    async getProductById(productId: string): Promise<ProductRespondDto> {
        const product = await this.productModel.findById(productId)
            .populate({
                path: 'variantIds',
                populate: {
                    path: 'variantUnits_ids',
                    model: 'VariantUnit'
                }
            })
            .populate('categories_ids')
            .populate('suppliers_id')
            .exec();
        if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm với id: ${productId}`);
        }
        console.log(JSON.stringify(product, null, 2));
        return ProductMapper.toDto(product);
    }



    async findAll(paginationDto: PaginationDto): Promise<void> {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy = 'createdAt',
            order = 'desc',
        } = paginationDto;

        const skip = (page - 1) * limit;

        const filter = search
            ? {
                name: { $regex: search, $options: 'i' }, 
            }
            : {};

        const sortOption: any = {};
        sortOption[sortBy] = order === 'asc' ? 1 : -1;

        const [data, total] = await Promise.all([
            this.productModel.find(filter).sort(sortOption).skip(skip).limit(limit),
            this.productModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

    //     return {
    //         data,
    //         total,
    //         page,
    //         limit,
    //         totalPages,
    //         hasNextPage: page < totalPages,
    //         hasPreviousPage: page > 1,
    //     };
    }

}