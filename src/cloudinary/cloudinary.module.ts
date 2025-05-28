import { Module } from "@nestjs/common";
import e from "express";
import { CloudinaryService } from "./cloudinary.service";
import { UploadController } from "./cloudinary.controller";

@Module({
    imports: [],
    controllers: [UploadController],
    providers: [CloudinaryService],
    exports: [CloudinaryService]
})
export class CloudinaryModule {}