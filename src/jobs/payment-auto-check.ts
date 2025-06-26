import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PaymentService } from "src/api/payment/payment.service";

@Injectable()
export class PaymentAutoCheckService {

    
    private readonly logger = new Logger(PaymentAutoCheckService.name);
    constructor(

        private readonly paymentService: PaymentService,
    ) { }

    @Cron('*/5 * * * *')
    async handlePaymentCheck() {
        const currentPendingPayment = await this.paymentService.findCurentPendingPayments()
        for (const payment of currentPendingPayment) {
            try {
                await this.paymentService.getZalopayPaymentStatus(payment._id);
            } catch (e) {
                this.logger.warn(`Không thể kiểm tra payment ${payment._id}: ${e.message}`);
            }
        }
    }

    
}