import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';

@Controller('redis-test')
export class RedisController {
    constructor(private readonly redisService: RedisService) { }

    @Post('set')
    async setCache(
        @Query('key') key: string,
        @Query('value') value: string,
        @Query('ttl') ttl?: string
    ) {
        await this.redisService.set(key, value, ttl ? parseInt(ttl) : undefined);
        return { message: `Set ${key} = ${value}` };
    }

    @Get('get/:key')
    async getCache(@Param('key') key: string): Promise<PartialStandardResponse<any>> {
        const value = await this.redisService.get(key);
        return {
            data: { key, value }
        };
    }

    @Post('del/:key')
    async delCache(@Param('key') key: string) {
        await this.redisService.del(key);
        return { message: `Deleted key ${key}` };
    }
}
