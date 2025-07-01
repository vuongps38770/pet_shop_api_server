import { Controller } from '@nestjs/common';
import { OrderLogService } from './order-log.service';

@Controller('order-log')
export class OrderLogController {
  constructor(private readonly orderLogService: OrderLogService) {}
}
