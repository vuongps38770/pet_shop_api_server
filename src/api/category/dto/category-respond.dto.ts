import { CategoryType } from "../models/category-.enum";

export class CategoryRespondDto {
    _id:string
    name: string;
    parentId: string
    categoryType: CategoryType
    isRoot: boolean;
}