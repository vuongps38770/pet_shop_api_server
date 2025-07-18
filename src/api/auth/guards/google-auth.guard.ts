import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    getAuthenticateOptions(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest<Request>();
        const options = super.getAuthenticateOptions?.(context) ?? {};
        return {
            ...options,
            state: req.query.state as string,
            prompt: 'select_account'
        };
    }
}
