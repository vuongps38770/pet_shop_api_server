// src/redis/redis.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  constructor(
    @Inject(RedisClient) private readonly redis: Redis
  ) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = typeof value === 'object' ? JSON.stringify(value) : value;
    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data as any;
    }
  }

  async del(key: string): Promise<void> {
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
