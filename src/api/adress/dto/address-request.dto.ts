import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class AddressCreateRequestDto {
    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsString()
    @IsNotEmpty()
    ward: string;

    @IsString()
    @IsNotEmpty()
    streetAndNumber: string;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;
}

export class AddressEditRequestDto {
    @IsString()
    @IsNotEmpty()
    _id: string;

    @IsString()
    @IsNotEmpty()
    province: string;

    @IsString()
    @IsNotEmpty()
    district: string;

    @IsString()
    @IsNotEmpty()
    ward: string;

    @IsString()
    @IsNotEmpty()
    streetAndNumber: string;

    @IsOptional()
    @IsNumber()
    lat?: number;

    @IsOptional()
    @IsNumber()
    lng?: number;
}