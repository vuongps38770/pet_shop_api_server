import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { PartialStandardResponse, StandardApiRespondSuccess } from "../type/standard-api-respond-format";
import { Response } from 'express';
import { Reflector } from "@nestjs/core";
import { RAW_RESPONSE_KEY } from "src/decorators/raw-decorator";
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<PartialStandardResponse<T>, StandardApiRespondSuccess<T>> {
    constructor(
        private readonly reflector:Reflector
    ){}
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const httpContext = context.switchToHttp();
        const response = httpContext.getResponse<Response>();
        const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        return next.handle()
            .pipe(
                map((partial: any) => {
                    if(isRaw){
                        return partial
                    }
                    const statusCode = partial?.code ?? 200;
                    return {
                        success:true,
                        code: statusCode,
                        message: partial?.message ?? "Request Success!",
                        data: partial?.data ?? null,
                    }
                })
            );
    }

}