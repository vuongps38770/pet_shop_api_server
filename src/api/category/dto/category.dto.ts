import { IsNotEmpty, IsString } from "class-validator";
import { CategoryType } from "../models/category-.enum";

export class CategoryRequestCreateDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    parentId: string
}

export class CategoryRequestEditDto {
    @IsString()
    @IsNotEmpty()
    id:string

    @IsString()
    @IsNotEmpty()
    name: string;
}