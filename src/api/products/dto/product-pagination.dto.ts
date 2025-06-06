import { IsIn, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsPositive()
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';



    @IsOptional()
    categoryId?: string;


    @IsOptional()
    supplierId?: string

    @IsOptional()
    rootCategoryId?:string;

    
    @IsOptional()
    inStock?:boolean
}