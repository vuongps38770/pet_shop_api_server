import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { StandardApiRespondFailure } from "../type/standard-api-respond-format";
import { AppException } from "../exeptions/app.exeption";

@Injectable()
@Catch()
export class AllExceptionsInterceptor implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : exception.message || 'Internal server error';

        const codeType =
            exception instanceof AppException
                ? exception.codeType
                : undefined



        const errorList =
            typeof message === 'object' && 'errors' in message
                ? message.errors
                : Array.isArray(message)
                    ? message
                    : [message];

        const res: StandardApiRespondFailure = {
            success: false,
            code: status,
            errors: errorList,
            path: request.url,
            codeType:codeType
        };
        if (status >= 500) {
            console.error('[INTERNAL ERROR]', {
                url: request.url,
                method: request.method,
                exception,
                stack: exception?.stack,
            });

        } else {
            res.errors = errorList;
        }
        response.status(status).json(res);

    }

}