import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export class GoogleOauthGuard extends AuthGuard('google') {
    async canActivate(context: ExecutionContext){
        const canActivate = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        request.user = request.user || {};
        return canActivate;
    }
}