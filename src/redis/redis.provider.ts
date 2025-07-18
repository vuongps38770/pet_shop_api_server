import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisClient = 'REDIS_CLIENT';

export const redisProvider: FactoryProvider<Promise<Redis>> = {
    provide: RedisClient,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Redis> => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const isSecure = redisUrl.startsWith('rediss://');
        const redis = new Redis(redisUrl, {
            // connectTimeout: 10000,
            // maxRetriesPerRequest: 5,
            // enableReadyCheck: true,
            // retryStrategy: (times) => {
            //     const delay = Math.min(times * 100, 3000);
            //     console.log(`🔁 Redis reconnecting... attempt ${times}, delay ${delay}ms`);
            //     return delay;
            // },
            tls: isSecure ? {} : undefined,
            // enableOfflineQueue: false,
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

        redis.on('close', () => {
            console.warn('🚪 Redis connection closed.');
        });

        redis.on('end', () => {
            console.warn('🏁 Redis connection ended.');
        });

        ////////////////////////////////////////////////////////
        const originalGet = redis.get.bind(redis);
        redis.get = async (...args) => {
            const result = await originalGet(...args);
            console.log(`[REDIS READ] GET ${args[0]} => ${result}`);
            return result;
        };


        const originalSet = redis.set.bind(redis);
        redis.set = async (...args) => {
            console.log(`[REDIS WRITE] SET ${args[0]} = ${args[1]}`);
            return await originalSet(...args);
        };
        return redis;
    },
    // useFactory: (configService: ConfigService) => {
    //     const redis = new Redis(configService.getOrThrow<string>('REDIS_URL'), {
    //         connectTimeout: 5000,
    //         maxRetriesPerRequest: 3,
    //         retryStrategy: (times) => {
    //             const delay = Math.min(times * 100, 2000);
    //             return delay;
    //         },
    //         enableOfflineQueue: true,
    //         keepAlive: 10000,

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
};
