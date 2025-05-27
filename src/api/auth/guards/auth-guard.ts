import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireAuth = this.reflector.get<boolean>('requireAuth', context.getHandler());
    if (!requireAuth) {
      return true; 
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('authorization is required'); 
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token'); 
    }
  }
}