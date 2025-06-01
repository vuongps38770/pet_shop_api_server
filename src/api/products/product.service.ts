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
import { ProductAdminRespondSimplizeDto, ProductPaginationRespondDto, ProductRespondDto, ProductRespondSimplizeDto } from "./dto/product-respond.dto";
import { ProductMapper } from "./mappers/product.mapper";
import { PaginationDto } from "./dto/product-pagination.dto";
import { UpdateProductDto } from "./dto/product-update.dto";

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
        let minPromotionalPrice: number = Number.POSITIVE_INFINITY;
        let maxPromotionalPrice: number = Number.NEGATIVE_INFINITY;
        let minSellingPrice: number = Number.POSITIVE_INFINITY;
        let maxSellingPrice: number = Number.NEGATIVE_INFINITY;


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
            if (variant.promotionalPrice < minPromotionalPrice) minPromotionalPrice = variant.promotionalPrice;
            if (variant.promotionalPrice > maxPromotionalPrice) maxPromotionalPrice = variant.promotionalPrice;
            if (variant.sellingPrice < minSellingPrice) minSellingPrice = variant.sellingPrice;
            if (variant.sellingPrice > maxSellingPrice) maxSellingPrice = variant.sellingPrice;

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
            maxPromotionalPrice,
            maxSellingPrice,
            minPromotionalPrice,
            minSellingPrice,
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



    async findAll(paginationDto: PaginationDto): Promise<ProductPaginationRespondDto<ProductRespondSimplizeDto>> {
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

        let [rawData, total] = await Promise.all([
            this.productModel.find(filter).sort(sortOption).skip(skip).limit(limit),
            this.productModel.countDocuments(filter),
        ]);
        const data = rawData.map(item =>
            ProductMapper.mapToSimplize(item)
        )
        log(rawData)
        const totalPages = Math.ceil(total / limit);

        return {
            data: data,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }


    async findAllForAdmin(paginationDto: PaginationDto): Promise<ProductPaginationRespondDto<ProductAdminRespondSimplizeDto>> {
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

        let [rawData, total] = await Promise.all([
            this.productModel.find(filter).sort(sortOption).skip(skip).limit(limit)
                .populate({
                    path: "variantIds",
                    model: "ProductVariant", // Ensure correct model is used
                    select: "stock"
                })
                .populate({
                    path: "categories_ids"
                })
                .populate("suppliers_id"),
            
            this.productModel.countDocuments(filter),
        ]);
        log(rawData)
        const data = rawData.map(item => {
            // Tính tổng stock từ các variant
            let sumStock = 0;
            if (item.variantIds && Array.isArray(item.variantIds)) {
                sumStock = item.variantIds.reduce((acc, variant: any) => acc + (variant?.stock || 0), 0);
            }
            const dto = ProductMapper.mapToSimplizeAdmin(item);
            return { ...dto, sumStock };
        });
        const totalPages = Math.ceil(total / limit);

        return {
            data: data,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }


    async editProductBasicInfo(productId: string, dto: UpdateProductDto, imageFiles?: Express.Multer.File[]): Promise<ProductRespondDto> {
        const product = await this.productModel.findById(productId);
        if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

        // Cập nhật thông tin cơ bản
        if (dto.name) product.name = dto.name;
        if (dto.categories) product.categories_ids = dto.categories.map(id => new Types.ObjectId(id));
        if (dto.suppliers_id) product.suppliers_id = new Types.ObjectId(dto.suppliers_id);

        // Cập nhật ảnh nếu có
        if (imageFiles && imageFiles.length > 0) {
            const imageUrls = await this.cloudinaryService.uploadMultiple(imageFiles);
            product.images = imageUrls;
        }

        await product.save();
        return this.getProductById(productId);
    }
}