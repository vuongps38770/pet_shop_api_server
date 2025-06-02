import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service'; 
import { Public } from 'src/decorators/public.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: CloudinaryService) {}
  @Public()
  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
  @Public()
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const urls = await this.uploadService.uploadMultiple(files);
    return { urls };
  }
}
