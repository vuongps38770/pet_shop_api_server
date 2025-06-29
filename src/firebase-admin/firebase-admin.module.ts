import { Module } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAdminController } from './firebase-admin.controller';

@Module({
  controllers: [FirebaseAdminController],
  providers: [FirebaseAdminService],
  exports:[FirebaseAdminService]
})
export class FirebaseAdminModule {}
