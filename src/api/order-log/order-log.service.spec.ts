import { Test, TestingModule } from '@nestjs/testing';
import { OrderLogService } from './order-log.service';

describe('OrderLogService', () => {
  let service: OrderLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderLogService],
    }).compile();

    service = module.get<OrderLogService>(OrderLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
