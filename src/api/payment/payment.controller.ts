import { Controller, Post, Req, Res, Body, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RawResponse } from 'src/decorators/raw.decorator';
import { Public } from 'src/decorators/public.decorator';
import { log } from 'console';
import { PartialStandardResponse } from 'src/common/type/standard-api-respond-format';
import { PaymentStatusResDto } from './dto/payment.res';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }


  @Public()
  @Post('zalopay-callback')
  @RawResponse()
  async zaloPayCallback(@Body() body: any) {
    return this.paymentService.handleZaloPayCallback(body);
  }

  @Post('zalopay-get-payment-url')
  async createZaloPayOrder(@Body() body: { orderId: string, returnUrl: string }): Promise<PartialStandardResponse<string>> {
    const order = await this.paymentService.getOrderById(body.orderId);
    if (!order) throw new Error('Order not found');
    const paymentUrl = await this.paymentService.createZaloPayPaymentUrl(order, body.returnUrl);
    return {
      data: paymentUrl
    };
  }

  @Get('payment-status')
  async getZalopayStatus(@Param('paymentId') paymentId:string):Promise<PartialStandardResponse<PaymentStatusResDto>> {
    const data = await this.paymentService.getPaymentStatus(paymentId)
    return{
      data
    }
  }

  @Get('get-available-payment/by-order/:orderId')
  async getPaymentByOrderId(@Param("orderId") orderId:string):Promise<PartialStandardResponse<any>> {
    const data = await this.paymentService.getPaymentByOrderId(orderId)
    return{
      data
    }
  }

  
}
