import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const createKafkaInstance = (configService: ConfigService) => {
  const caPath = path.join(os.tmpdir(), 'ca.pem');
  const certPath = path.join(os.tmpdir(), 'service.cert');
  const keyPath = path.join(os.tmpdir(), 'service.key');

  fs.writeFileSync(caPath, configService.getOrThrow<string>('KAFKA_CA_CONTENT'));
  fs.writeFileSync(certPath, configService.getOrThrow<string>('KAFKA_CERT_CONTENT'));
  fs.writeFileSync(keyPath, configService.getOrThrow<string>('KAFKA_KEY_CONTENT'));

  return new Kafka({
    clientId: 'main-server',
    brokers: [configService.getOrThrow<string>('KAFKA_BROKER')],
    ssl: {
      rejectUnauthorized: true,
      ca: [fs.readFileSync(caPath, 'utf-8')],
      cert: fs.readFileSync(certPath, 'utf-8'),
      key: fs.readFileSync(keyPath, 'utf-8'),
    },
  });
};
