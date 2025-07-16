import { Injectable } from "@nestjs/common";
import { v2 } from "cloudinary";



@Injectable()
export class CloudinaryService {
    constructor() {
        v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            
            
        });

    }
    async uploadImage(file: Express.Multer.File): Promise<string> {
        if (!file || !file.buffer) {
            throw new Error("No file provided or file buffer is empty");
        }
        return new Promise((resolve, reject) => {
            v2.uploader.upload_stream(
                { folder: "pet-shop" },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result?.secure_url || "");
                    }
                }
            ).end(file.buffer);
        });
    }
    async uploadMultiple(files: Express.Multer.File[]): Promise<string[]> {
        return Promise.all(files.map((file) => this.uploadImage(file)));
    }


    async uploadVideo(file: Express.Multer.File): Promise<string> {
        if (!file || !file.buffer) {
            throw new Error("No file provided or file buffer is empty");
        }
        return new Promise((resolve, reject) => {
            v2.uploader.upload_stream(
                { resource_type: "video", folder: "pet-shop" },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result?.secure_url || "");
                    }
                }
            ).end(file.buffer);
        });
    }
}