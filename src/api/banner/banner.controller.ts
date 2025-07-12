import { Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { BannerService } from './banner.service';
import { ImageBannerReqDto } from './dto/image-banner.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) { }


  @Post('image-banner')
  @UseInterceptors(FilesInterceptor('images'))
  async postImageBanner(@UploadedFiles() images: Express.Multer.File[], dto: ImageBannerReqDto) {
    const combineDto = { ...dto, images } as ImageBannerReqDto
    return this.bannerService.setImageBanner(combineDto)
  }

  @Get('image-banner')
  async getImageBanner():Promise<PartialStandardResponse<string[]>>{
    const data = await this.bannerService.getImageBanner()
    return {data}
  }
  
}
