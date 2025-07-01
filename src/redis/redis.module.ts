// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisProvider } from './redis.provider';
import { RedisController } from './redis.controller';

@Global()
@Module({
  providers: [redisProvider, RedisService],
  exports: [RedisService,redisProvider],
  controllers: [RedisController]
})
export class RedisModule { }
