import { HttpException, HttpStatus } from '@nestjs/common';
import {ApiErrorStatus} from '../../constants/api.error.keys'
export class AppException extends HttpException {
    codeType?: keyof typeof ApiErrorStatus
    constructor(message: string | string[], code: number = HttpStatus.BAD_REQUEST, codeType?: keyof typeof ApiErrorStatus) {
        super(
            {
                success: false,
                code: code,
                errors: Array.isArray(message) ? message : [message],
                codeType:codeType
            },
            code,
            
            
        );
        this.codeType = codeType
    }
}

