import { Controller } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';

@Controller('firebase-admin')
export class FirebaseAdminController {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}
}
