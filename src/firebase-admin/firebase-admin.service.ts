import { Injectable, OnModuleInit } from '@nestjs/common';
import { getFirebaseConfig } from './config/firebase.config';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    constructor(
        private configService: ConfigService,
    ) { }
    onModuleInit() {
        const firebaseConfig = getFirebaseConfig(this.configService)
        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount)
        })
    }

    async sendNotification(token: string, payload: admin.messaging.MessagingPayload) {
        const message: admin.messaging.Message = {
            token,
            notification: payload.notification,
            data: payload.data,
        };
        return admin.messaging().send(message);
    }

    async sendNotificationToTokens(tokens: string[], payload: admin.messaging.MessagingPayload) {
        console.log(tokens);

        for (const token of tokens) {
            try {
                await admin.messaging().send({
                    token,
                    notification: payload.notification,
                    data: payload.data,
                });
            } catch (err) {
                console.log(err);
                if (
                    err.code === 'messaging/invalid-registration-token' ||
                    err.code === 'messaging/registration-token-not-registered'
                ) {
                    // Xóa token hỏng 


                }
            }
        }
    }

}
