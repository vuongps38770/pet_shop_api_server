// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisProvider } from './redis.provider';
import { RedisController } from './redis.controller';

@Module({
  providers: [redisProvider, RedisService],
  exports: [RedisService],
  controllers:[RedisController]
})
export class RedisModule {}
