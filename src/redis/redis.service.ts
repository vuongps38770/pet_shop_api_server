import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisClient } from './redis.provider';
import { log } from 'console';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(RedisClient) private redis: Redis
  ) { }

  async pingWithTimeout(timeout = 2000): Promise<string> {
    return Promise.race([
      this.redis.ping(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), timeout)
      ),
    ]);
  }

  private async checkReady(): Promise<void> {
    try {
      log('checking');
      const pong = await this.pingWithTimeout();
      if (pong !== 'PONG') throw new Error('Redis not alive');
    } catch (err) {
      this.logger.warn('Redis ping failed, reconnecting...', err);
      await this.redis.quit();
      this.redis = new (require('ioredis'))(process.env.REDIS_URL, { tls: {} });
      await this.pingWithTimeout(); // Thử ping lại, có timeout
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.checkReady();
    const isObject = typeof value === 'object';
    const data = isObject ? JSON.stringify(value) : value;

    this.logger.log(
      `Redis SET key: "${key}", TTL: ${ttl ?? 'no TTL'}, Type: ${isObject ? 'JSON' : 'string'}, Value: ${isObject ? JSON.stringify(value).slice(0, 100) + '...' : value}`
    );

    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    log('doing')
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
    const result = await this.redis.rpush(queue, JSON.stringify(data));
    console.log(`[REDIS] Pushed to ${queue}, new length:`, result);
  }

  async popFromQueue(queue: string, timeout = 2): Promise<any> {
    const res = await this.redis.blpop(queue, timeout);
    console.log('[REDIS] Raw pop result:', res);
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
//     return new Redis(this.configService.getOrThrow<string>('REDIS_URL'),{
//       tls:{}
//     });
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
