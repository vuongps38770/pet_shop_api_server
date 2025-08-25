import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Producer } from 'kafkajs';
import { KAFKA_PRODUCER } from './kafka.provider';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  constructor(
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
  ) {}

  async sendMessage(topic: string, message: object) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to topic ${topic}`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }
}
