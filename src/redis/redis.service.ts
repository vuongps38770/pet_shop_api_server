import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(RedisClient) private readonly redis: Redis) { }

  private async checkReady(): Promise<void> {
    if (this.redis.status !== 'ready') {
      this.logger.warn(`Redis not ready: status = ${this.redis.status}`);
      await new Promise((r) => setTimeout(r, 1000));
      if (this.redis.status !== 'connect') {
        throw new Error('Redis still not ready');
      }
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.checkReady();
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    await this.checkReady();
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data as any;
    }
  }

  async del(key: string): Promise<void> {
    await this.checkReady();
    await this.redis.del(key);
  }

  async pushToQueue(queue: string, data: any): Promise<void> {
    await this.redis.rpush(queue, JSON.stringify(data));
  }

  async popFromQueue(queue: string): Promise<any> {
    const res = await this.redis.blpop(queue, 0);
    if (!res) return null;
    return JSON.parse(res[1]);
  }
}



// src/redis/redis.service.ts
// import { Inject, Injectable } from '@nestjs/common';
// import { Redis } from 'ioredis';
// import { RedisClient } from './redis.provider';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class RedisService {
//   constructor(
//     private readonly configService: ConfigService
//   ) { }
//   private getClient(): Redis {
//     return new Redis(this.configService.getOrThrow<string>('REDIS_URL'));
//   }
//   async set(key: string, value: any, ttl?: number): Promise<void> {
//     const redis = this.getClient();
//     const data = typeof value === 'object' ? JSON.stringify(value) : value;
//     if (ttl) {
//       await redis.set(key, data, 'EX', ttl);
//     } else {
//       await redis.set(key, data);
//     }
//     redis.disconnect();
//   }

//   async get<T = any>(key: string): Promise<T | null> {
//     const redis = this.getClient();
//     const data = await redis.get(key);
//     redis.disconnect();
//     if (!data) return null;
//     try {
//       return JSON.parse(data);
//     } catch {
//       return data as any;
//     }
//   }

//   async del(key: string): Promise<void> {
//     const redis = this.getClient();
//     await redis.del(key);
//     redis.disconnect();
//   }

//   async pushToQueue(queue: string, data: any): Promise<void> {
//     const redis = this.getClient();
//     await redis.rpush(queue, JSON.stringify(data));
//     redis.disconnect();
//   }

//   async popFromQueue(queue: string): Promise<any> {
//     const redis = this.getClient();
//     const res = await redis.blpop(queue, 0);
//     redis.disconnect();
//     if (!res) return null;
//     return JSON.parse(res[1]);
//   }
// }
