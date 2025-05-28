export class CategoryDto {

    name: string;
    description?: string;
    constructor(name: string, description?: string) {
        this.name = name;
        this.description = description;
    }


}