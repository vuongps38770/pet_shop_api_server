import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisClient = 'REDIS_CLIENT';

export const redisProvider: Provider = {
    provide: RedisClient,
    inject: [ConfigService],
    // useFactory: (configService: ConfigService) => {
    //     const redis = new Redis({
    //         host: configService.getOrThrow<string>('REDIS_HOST'),
    //         port: configService.getOrThrow<number>('REDIS_PORT'),
    //         password: configService.getOrThrow<string>('REDIS_PASSWORD'),
    //         tls: {},
    //         connectTimeout: 5000,
    //         maxRetriesPerRequest: 1,
    //         retryStrategy: () => null,
    //     });
    //     redis.on('connect', () => {
    //         console.log('🔌 Redis connected!');
    //     });

    //     redis.on('ready', () => {
    //         console.log('✅ Redis connection is ready to use!');
    //     });

    //     redis.on('error', (err) => {
    //         console.error('❌ Redis connection error:', err);
    //     });

    //     redis.on('reconnecting', () => {
    //         console.warn('🔁 Redis reconnecting...');
    //     });

    //     return redis;
    // },
    useFactory: (configService: ConfigService) => {
        const redis = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
            connectTimeout: 5000,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 100, 2000);
                return delay;
            },
            enableOfflineQueue: true,
            keepAlive: 10000,

        });

        redis.on('connect', () => {
            console.log('🔌 Redis connected!');
        });

        redis.on('ready', () => {
            console.log('✅ Redis connection is ready to use!');
        });

        redis.on('error', (err) => {
            console.error('❌ Redis connection error:', err);
        });

        redis.on('reconnecting', () => {
            console.warn('🔁 Redis reconnecting...');
        });

        return redis;
    },
};
