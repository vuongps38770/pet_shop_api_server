import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseAdminController } from './firebase-admin.controller';
import { FirebaseAdminService } from './firebase-admin.service';

describe('FirebaseAdminController', () => {
  let controller: FirebaseAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirebaseAdminController],
      providers: [FirebaseAdminService],
    }).compile();

    controller = module.get<FirebaseAdminController>(FirebaseAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
