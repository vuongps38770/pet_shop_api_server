import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { StandardApiRespondFailure } from "../type/standard-api-respond-format";

@Injectable()
@Catch()
export class AllExceptionsInterceptor implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : exception.message || 'Internal server error';

        if (typeof message === 'object' && message.success === false && message.code) {
            response.status(status).json(message);
        } else {
            const res: StandardApiRespondFailure = {
                success: false,
                code: status,
                errors: Array.isArray(message) ? message : [message],
            };
            response.status(status).json(res);
        }


    }

}