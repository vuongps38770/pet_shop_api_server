import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { log } from "console";
import { sha256 } from "js-sha256"
import { RefreshToken } from "./entity/refresh-token.entity";
import { AppException } from "src/common/exeptions/app.exeption";
export class RefreshTokenService {
    constructor(
        @InjectModel(RefreshToken.name) private readonly refreshTokenRepository: Model<RefreshToken>,
    ) { }
        
    async createOrUpdateToken(userId: string, token: string, expiresAt: Date, userAgent: string): Promise<RefreshToken> {
        const hashedToken = sha256(token)
        log("newhash", hashedToken)
        // Xóa token cũ trước khi tạo mới
        await this.refreshTokenRepository.deleteMany({ userId, userAgent });

        const newToken = new this.refreshTokenRepository({
            userId,
            hashedToken,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt,
            userAgent: userAgent
        });
        console.log('Creating new token:', newToken);
        return newToken.save();
    }


    async validateToken(userId: string, userAgent: string,
        /*rerfresh token tu client gui len*/token: string): Promise<boolean> {
        const refreshToken = await this.refreshTokenRepository.findOne({
            userId,
            userAgent: userAgent
        });
        console.log('Token từ client:', token);
        console.log('Token trong database:', refreshToken?.hashedToken);

        if (!refreshToken) {
            console.log("debug -- refreshToken not found", userAgent + " " + userId);
            throw new AppException("Invalid isExpired",401)
        }
        const isValid = sha256(token) === refreshToken.hashedToken
        log("debugg compare", token + " hashed: " + refreshToken.hashedToken)
        console.log('Kết quả so sánh token:', isValid);

        if (!isValid) {
            console.log("debug -- refreshToken not valid after compare");
            throw new AppException("Invalid token",401)
        }
        const isExpired = refreshToken.expiresAt < new Date();
        if (isExpired) {

            log("debug -- refreshToken isExpired")
            await this.refreshTokenRepository.deleteOne({ userId, userAgent });
            throw new AppException("RefreshToken isExpired",401,"EXPIRED_TOKEN")
        }
        // Cập nhật thời gian cập nhật
        refreshToken.updatedAt = new Date();
        await refreshToken.save();
        return true;
    }
    async deleteAllTokensByUserId(userId: string): Promise<void> {
        await this.refreshTokenRepository.deleteMany({ userId });
    }



    async logOut(userId: string, userAgent: string): Promise<boolean> {
        try {
            await this.refreshTokenRepository.deleteMany({ userId, userAgent })
            return true
        } catch (error) {
            throw new Error(error.message || "Lỗi")
        }
    }

    

}