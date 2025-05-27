import { UserRole } from "./role.enum";

export class TokenPayload {
    sub:string;
    role: UserRole;
    constructor(
        sub: string,
        role: UserRole
    ) {
        this.sub = sub;
        this.role = role;
    }
} 