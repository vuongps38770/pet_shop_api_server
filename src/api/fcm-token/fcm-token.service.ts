import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from '../auth/entity/refresh-token.entity';
import { Model } from 'mongoose';

@Injectable()
export class FcmTokenService {
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenRepository: Model<RefreshToken>,
    ) { }

    async updateFcmToken(userId: string, userAgent: string, fcmToken: string) {
        const result = await this.refreshTokenRepository.findOneAndUpdate(
            { userAgent, userId },
            { fcmToken },
            { new: true } 
        );

        if (!result) {
            throw new Error('Không tìm thấy phiên đăng nhập tương ứng để cập nhật FCM token.');
        }
    }
    async getAllFcmtokenFromUser(userId: string): Promise<string[]> {
        const data = await this.refreshTokenRepository.find({ userId })
        return data.map((item) => item.fcmToken).filter((token): token is string => !!token);
    }

    async getAllFcmtokenFromAllUser(): Promise<string[]> {
        const data = await this.refreshTokenRepository.find()
        const tokens = data.map((item) => item.fcmToken).filter((token): token is string => !!token);
        return [...new Set(tokens)]
    }
}
