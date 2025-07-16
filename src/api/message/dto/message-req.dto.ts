import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateMessageDto {

    @IsMongoId()
    @IsNotEmpty()
    conversationId: string;


    content: string;

    @IsOptional()
    @IsMongoId()
    productId?: string;

    @IsOptional()
    @IsMongoId()
    orderId?: string;

    @IsOptional()
    images?: string[];

}
