import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  controllers: [BannerController],
  providers: [BannerService],
  imports:[CloudinaryModule]
})
export class BannerModule {}
