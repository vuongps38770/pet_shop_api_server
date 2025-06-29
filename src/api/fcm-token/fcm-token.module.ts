import { Module } from '@nestjs/common';
import { FcmTokenService } from './fcm-token.service';
import { FcmTokenController } from './fcm-token.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [FcmTokenController],
  providers: [FcmTokenService],
  imports:[AuthModule],
  exports:[FcmTokenService]
})
export class FcmTokenModule {}
