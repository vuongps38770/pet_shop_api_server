import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisClient } from 'src/redis/redis.provider';
import { ImageBannerReqDto } from './dto/image-banner.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class BannerService {
    constructor(
        @Inject(RedisClient) private readonly redis: Redis,
        private readonly uploadService: CloudinaryService
    ) { }
    private readonly IMAGE_BANNER_KEY = "image_banner_key"
    async setImageBanner(dto: ImageBannerReqDto) {
        const { startTime, applicablePeriod, images } = dto;

        // const startDate = new Date(startTime);
        // if (isNaN(startDate.getTime())) {
        //     throw new BadRequestException('startTime không hợp lệ');
        // }

        if (!images || images.length === 0) {
            throw new BadRequestException('Phải gửi ít nhất 1 ảnh');
        }

        const uploadedUrls = await this.uploadService.uploadMultiple(images)


        const redisValue = JSON.stringify(uploadedUrls);

        if (applicablePeriod && applicablePeriod > 0) {
            await this.redis.set(this.IMAGE_BANNER_KEY, redisValue, 'EX', applicablePeriod);
        } else {
            await this.redis.set(this.IMAGE_BANNER_KEY, redisValue);
        }

        return uploadedUrls;
    }


    async getImageBanner(): Promise<string[]> {
        const data = await this.redis.get(this.IMAGE_BANNER_KEY);
        if(data ==null) return []
        const res = JSON.parse(data)
        return res
    }
}
