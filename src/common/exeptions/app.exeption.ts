import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
    constructor(message: string | string[], code: number = HttpStatus.BAD_REQUEST) {
        super(
            {
                success: false,
                code: code,
                errors: Array.isArray(message) ? message : [message],
            },
            code
        );
    }
}