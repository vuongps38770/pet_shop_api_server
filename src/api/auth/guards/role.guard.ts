import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "../models/role.enum";

export class RoleGuard {

    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<UserRole[]>("roles", context.getHandler());
        console.log('Required roles:', requiredRoles);
        if (!requiredRoles) {
            return true; // No roles required, allow access
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ForbiddenException('No token provided');
        }

        const token = authHeader.split(' ')[1];
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request.user = payload;

            if (!requiredRoles.includes(payload.role)) {
                throw new ForbiddenException('You do not have permission to access this resource');
            }

            return true;
        } catch (err) {
            throw new ForbiddenException('Invalid or expired token');
        }
    }
}