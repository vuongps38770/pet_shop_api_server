import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
    codeType?:CodeType
    constructor(message: string | string[], code: number = HttpStatus.BAD_REQUEST,codeType?:CodeType) {
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

export enum CodeType{

}