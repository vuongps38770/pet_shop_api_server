import { Test, TestingModule } from '@nestjs/testing';
import { OrderLogController } from './order-log.controller';
import { OrderLogService } from './order-log.service';

describe('OrderLogController', () => {
  let controller: OrderLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderLogController],
      providers: [OrderLogService],
    }).compile();

    controller = module.get<OrderLogController>(OrderLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
