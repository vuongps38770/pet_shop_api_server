import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const RedisClient = 'REDIS_CLIENT';

export const redisProvider: Provider = {
    provide: RedisClient,
    inject: [ConfigService],
    // useFactory: (configService: ConfigService) => {
    //     return new Redis({
    //         host: configService.get<string>('REDIS_HOST'),
    //         port: configService.get<number>('REDIS_PORT'),
    //         password: configService.get<string>('REDIS_PASSWORD'),
    //         db: configService.get<number>('REDIS_DB'),
    //     });
    // },
    useFactory: (configService: ConfigService) => {
        return new Redis(configService.getOrThrow<string>('REDIS_URL'));
    },
};
