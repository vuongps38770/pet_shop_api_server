import { Model } from "mongoose";
import { RefreshToken } from "./models/refresh-token.entity";
import * as bcrypt from 'bcryptjs';
import { InjectModel } from "@nestjs/mongoose";
import { UserRole } from "./models/role.enum";
import { log } from "console";
export class RefreshTokenService {
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenRepository: Model<RefreshToken>,
    ) { }

    async createOrUpdateToken(userId: string, token: string, expiresAt: Date,userAgent:string): Promise<RefreshToken> {
        const hashedToken = await bcrypt.hash(token, 10);
        log(`Creating or updating refresh token for userId: ${userId}, expiresAt: ${expiresAt}, userAgent: ${userAgent}`);
        const existingToken = await this.refreshTokenRepository.findOne({ userId, userAgent });
        if (existingToken) {
            existingToken.hashedToken = hashedToken;
            existingToken.expiresAt = expiresAt;
            return existingToken.save();
        }

        const newToken = new this.refreshTokenRepository({
            userId,
            hashedToken,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt,
            userAgent:userAgent
        });
        log(`newTokendocument: ${JSON.stringify(newToken)}`);
        
        return newToken.save();
    }


    async validateToken(userId: string, token: string): Promise<boolean> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            userId,
        });
        if (!refreshToken) {
            return false;
        }
        const isValid = await bcrypt.compare(token, refreshToken.hashedToken);
        if (!isValid) {
            return false;
        }
        const isExpired = refreshToken.expiresAt < new Date();
        if (isExpired) {
            await this.refreshTokenRepository.deleteOne({ userId });
            return false;
        }
        // Cập nhật thời gian cập nhật
        refreshToken.updatedAt = new Date();
        await refreshToken.save();
        return true;
    }
    async deleteAllTokensByUserId(userId: string): Promise<void> {
        await this.refreshTokenRepository.deleteMany({ userId });
    }
}