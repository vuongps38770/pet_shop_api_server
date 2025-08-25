// src/kafka/kafka-consumer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer } from 'kafkajs';
import { createKafkaInstance } from '../config/kafka.config';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private consumer: Consumer;

    constructor(private readonly configService: ConfigService,) { }

    async onModuleInit() {
        const kafka = createKafkaInstance(this.configService);

        this.consumer = kafka.consumer({ groupId: 'consumer-group' });
        await this.consumer.connect();

        await this.consumer.subscribe({
            topic: 'media-content-moderation-topic',
            fromBeginning: false,
        });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log({
                    partition,
                    offset: message.offset,
                    value: message.value?.toString(),
                });
            },
        });
    }

    async onModuleDestroy() {
        await this.consumer?.disconnect();
    }
}
