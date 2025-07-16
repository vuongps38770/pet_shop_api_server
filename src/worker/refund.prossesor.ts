import { Processor, Process, InjectQueue } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { Type } from "class-transformer";
import { Types } from "mongoose";
import { PaymentService } from "src/api/payment/payment.service";
import { RedisJobName, RedisQueueName } from "src/redis/constants/redis-queue.constant";

@Processor(RedisQueueName.REFUND_QUEUE)
export class RefundProcessor {
    constructor(
        private readonly paymentService: PaymentService,
    ) { }

    @Process(RedisJobName.REFUND_JOB)
    async handleRefund(job: Job<{ paymentId: string, orderId: string }>) {

        const { orderId, paymentId } = job.data;
        try {
            console.log(` Bắt đầu hoàn tiền cho order ${orderId}`);
            const refund = await this.paymentService.refundPayment(new Types.ObjectId(paymentId), "Hoàn tiền đơn hàng")
            
            console.log(`✅ Hoàn tiền thành công cho order ${orderId}`);
        } catch (err) {
            console.error(`❌ Refund thất bại cho order ${orderId}:`, err.message);
            throw err;
        }
    }
}
