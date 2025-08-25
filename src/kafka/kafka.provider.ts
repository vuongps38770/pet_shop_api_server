import { Provider } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as path from 'path';
import { createKafkaInstance } from './config/kafka.config';
export const KAFKA_PRODUCER = "KAFKA_PRODUCER"

export const KafkaProvider: Provider = {
  provide: KAFKA_PRODUCER,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const kafka = createKafkaInstance(configService);
    const producer = kafka.producer();
    await producer.connect();
    return producer;
  },
};
