import { Test, TestingModule } from '@nestjs/testing';
import { OrderHistoryService } from './order-history.service';

describe('OrderHistoryService', () => {
  let service: OrderHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderHistoryService],
    }).compile();

    service = module.get<OrderHistoryService>(OrderHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
