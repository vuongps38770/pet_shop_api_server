import { Injectable, Inject, forwardRef, HttpStatus } from '@nestjs/common';
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
import { ClientSession, Types } from 'mongoose';
import { PaymentResDto } from './dto/payment.res';
import qs from 'qs';

@Injectable()
export class PaymentService {
    constructor(
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => OrderService))
        private readonly orderService: OrderService,
    ) { }



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
            // const response = await axios.post(
            //     zalopayEndpoint,
            //     qs.stringify(data),
            //     {
            //         headers: {
            //             'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            //         }
            //     }
            // );
            // const resData = response.data;
            // log(resData)
            // if (resData.return_code !== 1) {
            //     throw new Error(`ZaloPay error: ${resData.return_message}`);
            // }


            let formBody: string[] = [];
            for (let i in data) {
                var encodedKey = encodeURIComponent(i);
                var encodedValue = encodeURIComponent(data[i]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            const formBodyString = formBody.join("&");
            let res = await fetch('https://sb-openapi.zalopay.vn/v2/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formBodyString
            });

            const resData = await res.json();
            log(resData)
            return {
                app_trans_id: resData.app_trans_id,
                zp_trans_token: resData.zp_trans_token
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


}
