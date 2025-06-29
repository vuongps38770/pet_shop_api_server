import { ConfigService } from '@nestjs/config';

export const getFirebaseConfig = (configService: ConfigService) => ({
  type: configService.getOrThrow<string>('FIREBASE_TYPE'),
  project_id: configService.getOrThrow<string>('FIREBASE_PROJECT_ID'),
  private_key_id: configService.getOrThrow<string>('FIREBASE_PRIVATE_KEY_ID'),
  private_key: configService.getOrThrow<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
  client_email: configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL'),
  client_id: configService.getOrThrow<string>('FIREBASE_CLIENT_ID'),
  auth_uri: configService.getOrThrow<string>('FIREBASE_AUTH_URI'),
  token_uri: configService.getOrThrow<string>('FIREBASE_TOKEN_URI'),
  auth_provider_x509_cert_url: configService.getOrThrow<string>('FIREBASE_AUTH_PROVIDER_CERT_URL'),
  client_x509_cert_url: configService.getOrThrow<string>('FIREBASE_CLIENT_CERT_URL'),
  universe_domain: configService.getOrThrow<string>('FIREBASE_UNIVERSE_DOMAIN'),
});