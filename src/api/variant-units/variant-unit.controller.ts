import { Controller, Get } from "@nestjs/common";
import e from "express";
import { Roles } from "src/decorators/roles.decorator";
import { UserRole } from "../auth/models/role.enum";

@Controller('variant-unit')
export class ProductController {
    constructor() {
    }

    @Get('site')
    @Roles(UserRole.ADMIN, UserRole.USER)
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API Products';
    }
}