import { CategoryType } from "../models/category-.enum";

export class CategoryRequestCreateDto {

    name: string;
    parentId?: string
    categoryType?: CategoryType
    isRoot: boolean;


}

export class CategoryRequestEditDto {
    id:string
    name: string;
}