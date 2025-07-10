import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { Product } from "./entity/product.entity";
import { CreateProductDto, VariantGroupRequestDto } from "./dto/product-request.dto";
import { VariantUnit } from "../variant-units/entity/variant-unit";
import { VariantGroup } from "../variant-group/entity/variant-group";
import { VariantGroupService } from "../variant-group/variant-group.service";
import { VariantUnitService } from "../variant-units/variant-unit.service";
import { ProductVariantService } from "../product-variant/product-variant.service";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { log } from "console";
import { ProductAdminRespondSimplizeDto, ProductPaginationRespondDto, ProductRespondDto, ProductRespondSimplizeDto, ProductSuggestionDto,SuggestionType } from "./dto/product-respond.dto";
import { ProductMapper } from "./mappers/product.mapper";
import { PaginationDto } from "./dto/product-pagination.dto";
import { UpdateProductDto, UpdateProductVariantPriceDto } from "./dto/product-update.dto";
import { CreateProductDescriptionDto } from "./dto/description-request.dto";
import { AppException } from "src/common/exeptions/app.exeption";
import { CategoryService } from "../category/category.service";
import Redis from "ioredis";
import { json } from "stream/consumers";



@Injectable()
export class ProductService {
    constructor(
        @InjectModel("Product") private readonly productModel: Model<Product>,
        private readonly variantGroupService: VariantGroupService,
        private readonly variantUnitService: VariantUnitService,
        private readonly variantService: ProductVariantService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly categoryService: CategoryService,
        @InjectConnection() private readonly connection: Connection,
        @Inject('REDIS_RATING') private readonly redis: Redis,

    ) { }




    async createProduct(data: CreateProductDto, imageFiles: Express.Multer.File[]): Promise<ProductRespondDto> {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
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
                }, session)
                createdGroups.push(savedGroup)


                for (let unit of group.units) {
                    const savedUnit = await this.variantUnitService.create({
                        name: unit.unitName,
                    }, savedGroup._id, session)
                    unitMap.set(`${savedGroup.name}-${unit.unitName}`, savedUnit._id);

                }
            }


            const savedVariantsIds: string[] = [];
            for (const variant of data.variants) {
                const unitIds: string[] = [];

                // Đảm bảo variant.unitValues và createdGroups có cùng độ dài
                if (variant.unitValues.length !== createdGroups.length) {
                    throw new Error(`Số lượng giá trị variant (${variant.unitValues.length}) không khớp với số lượng group (${createdGroups.length})`);
                }

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
                let promotionalPrice = variant.promotionalPrice;
                if (
                    promotionalPrice === undefined ||
                    promotionalPrice === null ||
                    promotionalPrice > variant.sellingPrice
                ) {
                    promotionalPrice = variant.sellingPrice;
                }

                const savedVariant = await this.variantService.create({
                    sku: variant.sku,
                    stock: variant.stock,
                    variantUnits_ids: unitIds,
                    importPrice: variant.importPrice,
                    promotionalPrice: promotionalPrice,
                    sellingPrice: variant.sellingPrice

                }, session);
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

            if (minPromotionalPrice === Number.POSITIVE_INFINITY) minPromotionalPrice = 0;
            if (maxPromotionalPrice === Number.NEGATIVE_INFINITY) maxPromotionalPrice = 0;
            if (minSellingPrice === Number.POSITIVE_INFINITY) minSellingPrice = 0;
            if (maxSellingPrice === Number.NEGATIVE_INFINITY) maxSellingPrice = 0;

            const newProduct = new this.productModel({
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

            const createdProduct = await newProduct.save({ session });
            const productId = createdProduct._id;

            await Promise.all(
                savedVariantsIds.map(variantId =>
                    this.variantService.updateProductId(variantId, productId.toString(), session)
                )
            );
            await session.commitTransaction();
            session.endSession();
            return await this.getProductById(createdProduct._id.toString())
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }


    async getProductById(productId: string): Promise<ProductRespondDto> {
        const cacheKey = `productDetail/${productId}`
        const cachedData = await this.redis.get(cacheKey)
        if(cachedData){
            console.log(JSON.parse(cachedData));
            return JSON.parse(cachedData)
        }
        const product = await this.productModel.findById(productId)
            .populate({
                path: 'variantIds',
                populate: {
                    path: 'variantUnits_ids',
                    populate: {
                        path: 'variantGroupId',
                        model: 'VariantGroup'
                    }
                }
            })
            .populate('categories_ids')
            .populate('suppliers_id')
            .exec();
        if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm với id: ${productId}`);
        }
        // console.log(JSON.stringify(product, null, 2));
        const data = ProductMapper.toDto(product); 
        await this.redis.setex(cacheKey,1800,JSON.stringify(data))
        log(`cached productDetail/${productId}`)
        return data
    }

    async getProductByIdAndSimpilize(productId: string) {
        let prod = await this.getProductById(productId)
        return ProductMapper.mapToSimplize(prod)
    }

    async findAll(paginationDto: PaginationDto): Promise<ProductPaginationRespondDto<ProductRespondSimplizeDto>> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc',
        } = paginationDto;


        const skip = (page - 1) * limit;
        const filter: any = {isActivate:true};
        if (paginationDto.search?.trim()) {
            filter.$or = [
                { name: { $regex: paginationDto.search.trim(), $options: 'i' } },
                { brand: { $regex: paginationDto.search.trim(), $options: 'i' } },
            ];
        }

        if (paginationDto.categoryId?.trim()) {
            console.log(paginationDto.categoryId);
            filter.categories_ids = { $in: [paginationDto.categoryId] };
        }

        else if (paginationDto.rootCategoryId?.trim()) {
            const childCategoryIds = await this.categoryService.getChildIds(paginationDto.rootCategoryId);


            filter.categories_ids = { $in: childCategoryIds };
        }

        if (paginationDto.supplierId?.trim()) {
            filter.suppliers_id = paginationDto.supplierId;
        }
        const sortOption: any = {};
        sortOption[sortBy] = order === 'asc' ? 1 : -1;
        console.log(filter);

        let [rawData, total] = await Promise.all([
            this.productModel.find(filter).sort(sortOption).skip(skip).limit(limit),
            this.productModel.countDocuments(filter),
        ]);





        const data = await Promise.all(
            rawData.map(async (item) => {
                const productId = item._id.toString();
                const redisKey = `product_rating:${productId}`;
                const ratingData = await this.redis.hgetall(redisKey);

                const average = ratingData?.average ? parseFloat(ratingData.average) : 0;
                const total = ratingData?.total ? parseInt(ratingData.total) : 0;

                return {
                    ...ProductMapper.mapToSimplize(item),
                    rating: {
                        average,
                        total
                    }
                };
            })
        );

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
                    model: "ProductVariant", 
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

    async editProductDescription(productId: string, dto: CreateProductDescriptionDto[]): Promise<ProductRespondDto> {
        const product = await this.productModel.updateOne({ _id: productId }, dto)
        if (product.modifiedCount <= 0) {
            throw new Error("Product not found")
        }
        return await this.getProductById(productId)
    }

    async getProductHasVariantId(variantId: string): Promise<Product> {
        const product = await this.productModel.findOne({ variantIds: variantId })

        if (!product) {
            throw new Error("product not found")
        }
        return product
    }

    async editManyProductvariantPrice(productId: string, dto: UpdateProductVariantPriceDto[]): Promise<ProductRespondDto> {
        try {
            for (let item of dto) {
                await this.variantService.editProductvariantPrice(item)
            }
            const product = await this.getProductById(productId)
            if (!product) {
                throw new Error("product not found")
            }
            this.updateProductPriceRange(productId)
            return product
        } catch (error) {
            throw error
        }
    }


    async updateProductPriceRange(productId: string): Promise<void> {
        const product = await this.productModel.findById(productId).populate({
            path: "variantIds",
            model: "ProductVariant",
            select: "promotionalPrice sellingPrice"
        });

        if (!product || !product.variantIds || product.variantIds.length === 0) {
            throw new Error("Product or variants not found");
        }

        let minPromotionalPrice = Number.POSITIVE_INFINITY;
        let maxPromotionalPrice = Number.NEGATIVE_INFINITY;
        let minSellingPrice = Number.POSITIVE_INFINITY;
        let maxSellingPrice = Number.NEGATIVE_INFINITY;

        for (const variant of product.variantIds as any[]) {
            if (variant && typeof variant === 'object' && 'promotionalPrice' in variant && 'sellingPrice' in variant) {
                if (typeof variant.promotionalPrice === "number") {
                    if (variant.promotionalPrice < minPromotionalPrice) minPromotionalPrice = variant.promotionalPrice;
                    if (variant.promotionalPrice > maxPromotionalPrice) maxPromotionalPrice = variant.promotionalPrice;
                }
                if (typeof variant.sellingPrice === "number") {
                    if (variant.sellingPrice < minSellingPrice) minSellingPrice = variant.sellingPrice;
                    if (variant.sellingPrice > maxSellingPrice) maxSellingPrice = variant.sellingPrice;
                }
            }
        }


        if (minPromotionalPrice === Number.POSITIVE_INFINITY) minPromotionalPrice = 0;
        if (maxPromotionalPrice === Number.NEGATIVE_INFINITY) maxPromotionalPrice = 0;
        if (minSellingPrice === Number.POSITIVE_INFINITY) minSellingPrice = 0;
        if (maxSellingPrice === Number.NEGATIVE_INFINITY) maxSellingPrice = 0;

        product.minPromotionalPrice = minPromotionalPrice;
        product.maxPromotionalPrice = maxPromotionalPrice;
        product.minSellingPrice = minSellingPrice;
        product.maxSellingPrice = maxSellingPrice;

        await product.save();
    }
    async validateProduct(productId?: string): Promise<void> {
        if (productId) {
            const product = await this.productModel.findById(new Types.ObjectId(productId));
            if (!product) {
                throw new AppException('Product not found', 404);
            }
        }
    }


    async updateProductStock() {

    }

    async getPersonalizedSuggestions(userId?: string, limit: number = 10): Promise<ProductSuggestionDto[]> {
        const redisKey = `personalized_suggestions:${userId || 'anonymous'}`;
        
        // Kiểm tra cache Redis
        const cachedData = await this.redis.get(redisKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }

        let suggestions: ProductSuggestionDto[] = [];

        if (userId) {
            // Lấy sản phẩm từ danh sách yêu thích
            suggestions = await this.getFavoriteProducts(userId, limit);
            
            // Nếu không đủ, lấy sản phẩm liên quan đến sản phẩm đã mua
            if (suggestions.length < limit) {
                const relatedProducts = await this.getRelatedProductsByPurchaseHistory(userId, limit - suggestions.length);
                suggestions = [...suggestions, ...relatedProducts];
            }
        }

        // Nếu vẫn không đủ hoặc không có userId, lấy ngẫu nhiên
        if (suggestions.length < limit) {
            const randomProducts = await this.getRandomProducts(limit - suggestions.length);
            suggestions = [...suggestions, ...randomProducts];
        }

        // Cache trong Redis 30 phút
        await this.redis.setex(redisKey, 1800, JSON.stringify(suggestions));
        
        return suggestions;
    }

    async getPopularProducts(limit: number = 10): Promise<ProductSuggestionDto[]> {
        const redisKey = `popular_products:${limit}`;
        
        // Kiểm tra cache Redis
        const cachedData = await this.redis.get(redisKey);
        if (cachedData) {
            console.log('cached',cachedData);
            
            return JSON.parse(cachedData);
        }

        // Lấy sản phẩm phổ biến nhất dựa trên rating và số lượng đánh giá
        const popularProducts = await this.productModel.aggregate([
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'reviews'
                }
            },
            {
                $match: {
                    isActivate: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    images: 1,
                    averageRating: { $avg: '$reviews.rating' },
                    totalReviews: { $size: '$reviews' }
                }
            },
            {
                $sort: {
                    averageRating: -1,
                    totalReviews: -1
                }
            },
            {
                $limit: limit
            }
        ]);

        const suggestions: ProductSuggestionDto[] = popularProducts.map(product => ({
            _id: product._id.toString(),
            name: product.name,
            images: product.images || []
        }));

        // Cache trong Redis 30 phút
        await this.redis.setex(redisKey, 1800, JSON.stringify(suggestions));
        
        return suggestions;
    }

    async getProductSuggestions(
        type: SuggestionType, 
        userId?: string, 
        limit: number = 10
    ): Promise<ProductSuggestionDto[]> {
        switch (type) {
            case SuggestionType.PERSONALIZED:
                return this.getPersonalizedSuggestions(userId, limit);
            case SuggestionType.POPULAR:
                return this.getPopularProducts(limit);
            default:
                throw new BadRequestException(`Loại gợi ý không hợp lệ: ${type}`);
        }
    }

    private async getFavoriteProducts(userId: string, limit: number): Promise<ProductSuggestionDto[]> {
        try {
            const favoriteProducts = await this.productModel.aggregate([
                {
                    $lookup: {
                        from: 'favorites',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'favorites'
                    }
                },
                {
                    $match: {
                        'favorites.userId': new Types.ObjectId(userId),
                        isActivate: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        images: 1
                    }
                },
                {
                    $limit: limit
                }
            ]);

            return favoriteProducts.map(product => ({
                _id: product._id.toString(),
                name: product.name,
                images: product.images || []
            }));
        } catch (error) {
            console.log('Error getting favorite products:', error);
            return [];
        }
    }

    private async getRelatedProductsByPurchaseHistory(userId: string, limit: number): Promise<ProductSuggestionDto[]> {
        try {
            const relatedProducts = await this.productModel.aggregate([
                {
                    $lookup: {
                        from: 'orderdetails',
                        localField: '_id',
                        foreignField: 'productId',
                        as: 'orderDetails'
                    }
                },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'orderDetails.orderId',
                        foreignField: '_id',
                        as: 'orders'
                    }
                },
                {
                    $match: {
                        'orders.userID': new Types.ObjectId(userId),
                        isActivate: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        images: 1
                    }
                },
                {
                    $limit: limit
                }
            ]);

            return relatedProducts.map(product => ({
                _id: product._id.toString(),
                name: product.name,
                images: product.images || []
            }));
        } catch (error) {
            console.log('Error getting related products:', error);
            return [];
        }
    }

    private async getRandomProducts(limit: number): Promise<ProductSuggestionDto[]> {
        const randomProducts = await this.productModel.aggregate([
            {
                $match: {
                    isActivate: true
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    images: 1
                }
            },
            {
                $sample: { size: limit }
            }
        ]);

        return randomProducts.map(product => ({
            _id: product._id.toString(),
            name: product.name,
            images: product.images || []
        }));
    }
}