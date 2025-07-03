import { HttpException, HttpStatus } from '@nestjs/common';
import {ApiErrorStatus} from '../../constants/api.error.keys'
export class AppException extends HttpException {
    codeType?: string;
    constructor(message: string | string[], code: number = HttpStatus.BAD_REQUEST, codeType?: string) {
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

