import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaService } from './kalfka.service';
import { KafkaProvider } from './kafka.provider';
import { TestKK } from './test.controller';
import { ClientsModule } from '@nestjs/microservices';
import { KafkaConsumerService } from './consumer/kafka-consumer.service';

@Module({
  imports: [ConfigModule],
  providers: [KafkaProvider, KafkaService,KafkaConsumerService],
  exports: [KafkaService],
  controllers:[TestKK]
})
export class KafkaModule {}
