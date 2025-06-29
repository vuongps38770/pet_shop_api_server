import { Injectable, Inject, forwardRef, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentType } from '../order/models/payment-type';
import { Order } from '../order/entity/order.entity';
import axios from 'axios';
import * as crypto from 'crypto';
import { OrderService } from '../order/order.service';
import { OrderRespondDto } from '../order/dto/order.respond';
import { log } from 'console';
import { OrderStatus } from '../order/models/order-status';
import { AppException } from 'src/common/exeptions/app.exeption';
import { ClientSession, Model, Types } from 'mongoose';
import { PaymentResDto, PaymentStatusResDto } from './dto/payment.res';
import qs from 'qs';
import { InjectModel } from '@nestjs/mongoose';
import { Payment } from './entity/payment.entity';
import { TimeLimit } from 'src/constants/TimeLimit';
import { PaymentPurpose } from './models/payment-purpose.enum';

@Injectable()
export class PaymentService {
    constructor(
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => OrderService))
        private readonly orderService: OrderService,
        @InjectModel("Payment") private readonly paymentModel: Model<Payment>,

    ) { }

    private readonly logger = new Logger(PaymentService.name)

    private async createMomoPaymentUrl(order: Order, returnUrl: string): Promise<string> {
        // TODO: Implement Momo payment integration
        const momoEndpoint = this.configService.get<string>('MOMO_ENDPOINT');
        const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
        const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
        const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');

        // Implement Momo payment logic here
        return '';
    }

    private async createVNPayPaymentUrl(order: Order, returnUrl: string): Promise<string> {
        // TODO: Implement VNPay payment integration
        const vnpayEndpoint = this.configService.get<string>('VNPAY_ENDPOINT');
        const merchantId = this.configService.get<string>('VNPAY_MERCHANT_ID');
        const secureHash = this.configService.get<string>('VNPAY_SECURE_HASH');

        // Implement VNPay payment logic here
        return '';
    }

    public async createZaloPayPaymentUrl(order: OrderRespondDto, returnUrl: string): Promise<string> {
        const zalopayEndpoint = this.configService.get<string>('ZALOPAY_ENDPOINT') ?? 'https://sb-openapi.zalopay.vn/v2/create';
        const appId = this.configService.get<string>('ZALOPAY_APP_ID') ?? '2554';
        const key1 = this.configService.get<string>('ZALOPAY_KEY1') ?? 'sdngKKJmqEMzvh5QQcdD2A9XBSKUNaYn';
        const appUser = order.userID;
        const appTransId = this.generateAppTransId(order.sku);
        const appTime = Date.now();
        const amount = order.totalPrice;
        const embedData = JSON.stringify({ order_id: order._id.toString(), });

        const data = {
            app_id: +appId,
            app_user: appUser,
            app_trans_id: appTransId,
            app_time: appTime,
            amount,
            embed_data: embedData,
            description: `Thanh toán đơn hàng ${order.sku}`,
            bank_code: 'zalopayapp',
            callback_url: this.configService.get<string>('ZALOPAY_CALLBACK_URL'),
            item: JSON.stringify(order.orderDetailItems),
        };

        const macStr = [
            data.app_id,
            data.app_trans_id,
            data.app_user,
            data.amount,
            data.app_time,
            data.embed_data,
            data.item,
        ].join('|');

        const mac = crypto.createHmac('sha256', key1).update(macStr).digest('hex');

        const requestBody = {
            ...data,
            mac,
        };
        log(requestBody)
        try {
            const response = await axios.post(zalopayEndpoint, requestBody);
            const resData = response.data;
            log(resData)
            if (resData.return_code !== 1) {
                throw new Error(`ZaloPay error: ${resData.return_message}`);
            }

            return resData.order_url;
        } catch (error) {
            if (error?.response?.data) {
                console.error('ZaloPay API error:', error.response.data);
                throw new Error('ZaloPay: ' + JSON.stringify(error.response.data));
            }
            console.error('ZaloPay API error:', error.message);
            throw new Error('Không thể tạo liên kết thanh toán ZaloPay');
        }
    }
    public async createZalopayTransToken(orderId: string | Types.ObjectId, session: ClientSession): Promise<PaymentResDto> {
        const order = await this.orderService.findOrderByIdWidthSession(orderId, session)
        const zalopayEndpoint = this.configService.get<string>('ZALOPAY_ENDPOINT') ?? 'https://sb-openapi.zalopay.vn/v2/create';
        const appId = this.configService.get<string>('ZALOPAY_APP_ID') ?? '2553';
        const key = this.configService.get<string>('ZALOPAY_MOBILE_KEY') ?? 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL';
        const appUser = order.userID;
        const appTransId = this.generateAppTransId(order.sku);
        const appTime = Date.now();
        const amount = order.totalPrice;
        const embedData = JSON.stringify({ order_id: order._id.toString(), });
        const item = JSON.stringify(order.orderDetailItems)

        const macStr = [
            appId,
            appTransId,
            appUser,
            amount,
            appTime,
            embedData,
            item
        ].join('|');

        const mac = crypto.createHmac('sha256', key).update(macStr).digest('hex');

        const data = {
            'app_id': +appId,
            'app_user': appUser,
            'app_time': appTime,
            'amount': amount,
            'app_trans_id': appTransId,
            'embed_data': embedData,
            'item': item,
            'description': `Thanh toán đơn hàng ${order.sku}`,
            'mac': mac
        };



        try {
            let formBody: string[] = [];
            for (let i in data) {
                var encodedKey = encodeURIComponent(i);
                var encodedValue = encodeURIComponent(data[i]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            const formBodyString = formBody.join("&");
            let res = await fetch(zalopayEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formBodyString
            });

            const resData = await res.json();
            log(resData)
            const payment = new this.paymentModel({
                amount: amount,
                orderId: new Types.ObjectId(order._id),
                provider: PaymentType.ZALOPAY,
                status: 'PENDING',
                gateway_code: resData.zp_trans_token,
                expiredAt: order.expiredDate || new Date(Date.now() + TimeLimit['15mins']),
                paymentPurpose: PaymentPurpose.PAY,
                transactionId: appTransId,
            })
            await payment.save()
            return {
                transactionId: resData.app_trans_id,
                gateway_code: resData.zp_trans_token,
                _id:payment._id.toString()
            };
        } catch (error) {
            console.error('ZaloPay API error:', error);
            throw new AppException('Không tạo được giao dịch ZaloPay', HttpStatus.BAD_GATEWAY);
        }
    }
    private generateAppTransId(orderId: string): string {
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(2);
        const rand = Math.floor(Math.random() * 100000);
        return `${yy}${mm}${dd}_${rand}${orderId}`;
    }

    async verifyPayment(paymentType: PaymentType, paymentData: any): Promise<boolean> {
        switch (paymentType) {
            case PaymentType.MOMO:
                return await this.verifyMomoPayment(paymentData);
            case PaymentType.VNPAY:
                return await this.verifyVNPayPayment(paymentData);
            case PaymentType.ZALOPAY:
                return await this.verifyZaloPayPayment(paymentData);
            default:
                throw new Error('Phương thức thanh toán không được hỗ trợ');
        }
    }

    private async verifyMomoPayment(paymentData: any): Promise<boolean> {
        // TODO: Implement Momo payment verification
        return false;
    }

    private async verifyVNPayPayment(paymentData: any): Promise<boolean> {
        // TODO: Implement VNPay payment verification
        return false;
    }

    private async verifyZaloPayPayment({ zp_trans_token, app_trans_id }): Promise<boolean> {
        // TODO: Implement ZaloPay payment verification
        return false;
    }

    async handleZaloPayCallback(body: any) {
        const key2 = this.configService.get<string>('ZALOPAY_KEY2');


        const { type, mac, data } = body;

        if (!key2) throw new AppException("env not found")
        if (!this.verifyChecksum(data, key2, mac)) {
            throw new Error('Invalid checksum');
        }

        const dataObj = JSON.parse(data);


        log(dataObj)
        const embedData = JSON.parse(dataObj.embed_data)
        if (Number(type) === 1) {
            console.log("payment ok", embedData);
            await this.orderService.systemUpdateOrderStatus(embedData.order_id, OrderStatus.PAYMENT_SUCCESSFUL);
        } else {
            console.log("payment failed");

        }
    }

    private verifyChecksum(payload: string, key2: string, mac: string): boolean {

        const reqmac = crypto.createHmac('sha256', key2).update(payload).digest('hex');
        return mac === reqmac;
    }

    public async getOrderById(orderId: string): Promise<OrderRespondDto | null> {
        return this.orderService.findOrderById(orderId)
    }
    async getPaymentStatus(paymentId: string | Types.ObjectId){
        const payment = await this.paymentModel.findById(paymentId)
        if (!payment) throw new AppException("Không tìm thây sgiao dịch")
        if(payment.provider=='ZALOPAY'){
            return await this.getZalopayPaymentStatus(paymentId)
        }else{
            throw new AppException("Đơn hàng hiện ko thể truy cập")
        }
    }
    //1: thành công
    //2: thaats biaj
    //3: pending
    //4: het hanj
    async getZalopayPaymentStatus(paymentId: string | Types.ObjectId): Promise<PaymentStatusResDto> {
        const payment = await this.paymentModel.findById(paymentId)
        if (!payment) throw new AppException("Không tìm thây sgiao dịch")
        if (payment.status == 'SUCCESS') {
            return {
                return_code: 1
            }
        }
        if (payment.status == 'EXPIRED') {
            return {
                return_code: 4
            }
        }
        if (payment.expiredAt && payment.expiredAt.getTime() < Date.now()) {
            if (payment.status == 'PENDING') {
                payment.status = 'EXPIRED'
                await payment.save()
            }

            return {
                return_code: 4
            }
        }
        const config = {
            refundEndpoint: this.configService.getOrThrow("ZALOPAY_REFUND_ENDPOINT"),
            app_id: this.configService.getOrThrow("ZALOPAY_APP_ID"),
            key1: this.configService.getOrThrow("ZALOPAY_MOBILE_KEY")
        }
        let macStr = config.app_id + "|" + payment.transactionId + "|" + config.key1
        let mac = crypto.createHmac('sha256', config.key1).update(macStr).digest('hex')


        const body = {
            app_id: +config.app_id,
            app_trans_id: payment.transactionId,
            mac
        }
        const res = await axios.post(config.refundEndpoint, body)
        const {
            return_code,
            return_message,
            sub_return_code,
            sub_return_message,
            is_processing,
            amount,
            discount_amount,
            zp_trans_id
        } = res.data

        log(res.data)
        if (return_code == 2) {
            this.logger.debug(`Không thể truy vấn trạng thái, sub_return_code:${sub_return_code}, sub_return_message:${sub_return_message}`, PaymentService.name)
            throw new Error("lỗi hệ thống")
        } else if (return_code == 1) {
            payment.amount = amount,
                payment.discount_amount = discount_amount,
                payment.status = 'SUCCESS'
            await payment.save()
            return {
                return_code
            }
        }
        else if (return_code == 3) {
            // todo:giao đang thực hiện
            if (is_processing) {
                //đơn hàng đang xử lý
            } else {

            }
            return {
                return_code
            }
        }
        else throw new Error("Lỗi, không hể truy suất trạng thái đơn hàng!")
    }

    async findCurentPendingPayments() {
        return await this.paymentModel.find({
            status: 'PENDING',
            createdAt: { $gt: new Date(Date.now() - 1000 * 60 * 30) },
        });
    }
}

