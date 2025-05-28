import { Inject, Injectable, Logger, Res } from "@nestjs/common";
import { Response } from 'express';
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./models/user.entity";
import { Document, Model } from "mongoose";
import { UserCreateData } from "./dto/auth.dto.userCreateData";
import * as bcrypt from 'bcryptjs';
import { Otp } from "./models/otp.enity";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenService } from "./refresh-token.service";
import { TokenPayload } from "./models/token-payload";
@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel('Otp') private readonly otpModel: Model<Otp>,
        private readonly refreshTokenService: RefreshTokenService,
        @Inject('JWT_ACCESS') private readonly jwtAccessService: JwtService,
        @Inject('JWT_REFRESH') private readonly jwtRefreshService: JwtService,
    ) { }
    /*
    signUp thong thuong qua sdt
    usage: production
    @param: data: UserCreateData - Thông tin người dùng mới
    @returns: Promise<User> - Trả về người dùng mới đã được tạo
    */
    async signUp(data: UserCreateData): Promise<User> {
        if (!data.name || !data.surName || !data.password || !data.phone || !data.otpCode) {
            throw new Error('Missing required fields: surName, name, phone, or password');
        }
        // if (!data.password || data.password.length < 6) {
        //     throw new Error('Password must be at least 6 characters long');
        // }
        if (data.otpCode) {
            // Kiểm tra OTP trước khi tạo người dùng
            const isOtpValid = await this.checkPhoneOtp(data.phone, data.otpCode);
            if (!isOtpValid) {
                throw new Error('Invalid OTP');
            }
        }
        const existingUser = await this.findByPhone(data.phone);
        if (existingUser) {
            throw new Error('User with this phone number already exists');
        }
        data.password = bcrypt.hashSync(data.password, 10);
        const newUser = new this.userModel(data);
        return await newUser.save();
    }
    /*
    signUp thong thuong qua sdt
    usage: test (ko can otp)
    @param: data: UserCreateData - Thông tin người dùng mới
    @returns: Promise<User> - Trả về người dùng mới đã được tạo
    */
    async signUpTest(data: UserCreateData): Promise<User> {
        if (!data.name || !data.surName || !data.password || !data.phone) {
            throw new Error('Missing required fields: surName, name, phone, or password');
        }
        const existingUser = await this.findByPhone(data.phone);
        if (existingUser) {
            throw new Error('User with this phone number already exists');
        }
        data.password = bcrypt.hashSync(data.password, 10);
        const newUser = new this.userModel(data);
        return await newUser.save();
    }


    /*
    tao otp
    usage: production
    @param: phone: string - Số điện thoại của người dùng
    @returns: Promise<string> - Trả về mã OTP đã được tạo
    */

    async sendPhoneOtpToPhone(phone: string): Promise<boolean> {
        const otp_api_key = process.env.OTP_API_KEY;
        const otp_api_url = process.env.OTP_API_URL;
        const otp_api_secret = process.env.OTP_API_SECRET;
        if (!otp_api_key || !otp_api_url || !otp_api_secret) {
            throw new Error('OTP API configuration is missing');
        }
        // Gửi OTP đến số điện thoại qua API
        const otp = await this.createRandomPhoneOtp();
        const response = await fetch(`${otp_api_url}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ApiKey: otp_api_key,
                    Content: otp + " la ma xac minh dang ky Baotrixemay cua ban",
                    Phone: phone,
                    SecretKey: otp_api_secret,
                    Brandname: 'Baotrixemay',
                    SmsType: "2"
                })
            }
        )
        if (!response.ok) {
            throw new Error('Failed to send OTP - API error');
        }
        const data = await response.json();
        console.log('OTP API response:', data);
        if (data.CodeResult === `100`) {
            // Lưu OTP vào cơ sở dữ liệu
            const isSaved = await this.savePhoneOtp(phone, otp);
            return isSaved;
        } else {
            Logger.error('Failed to send OTP:', data);
            throw new Error('Failed to send OTP');
        }
    }
    // Lưu mã OTP vào cơ sở dữ liệu
    private async savePhoneOtp(phone: string, otp: string): Promise<boolean> {
        const otpCode = await this.otpModel.create(
            {
                phone,
                otp,
            }
        )
        if (!otpCode) {
            return false
        }
        return true;

    }
    // tao ma otp ngau nhien
    private async createRandomPhoneOtp(): Promise<string> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        return otp;
    }



    /*
     check otp
     usage: production
        @param: phone: string - Số điện thoại của người dùng
        @param: otp: string - Mã OTP cần kiểm tra
        @returns: Promise<boolean> - Trả về true nếu OTP hợp lệ, false nếu không hợp lệ
    */
    async checkPhoneOtp(phone: string, otp: string): Promise<boolean> {
        const otpRecord = await this.otpModel.findOne({ phone, otp }).exec();
        if (!otpRecord) {
            throw new Error('Invalid OTP or phone number');
        }
        const currentTime = new Date();
        if (otpRecord.expiresAt && otpRecord.expiresAt < currentTime) {
            throw new Error('OTP has expired');
        }
        // Xóa OTP sau khi kiểm tra thành công
        await this.otpModel.deleteOne({ _id: otpRecord._id }).exec();
        return true;
    }




    private async findByEmail(email: string): Promise<User | null> {
        return await this.userModel.findOne({ email }).exec();
    }
    private async findByPhone(phone: string): Promise<User | null> {
        return await this.userModel.findOne({ phone }).exec();
    }

    async loginWithPhoneorEmail(
        phoneOrEmail: string,
        password: string,
        userAgent: string
    ): Promise<{ accessToken: string, refreshToken: string }> {
        const user = await this.findByPhone(phoneOrEmail) || await this.findByEmail(phoneOrEmail);
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }
        // Tạo token mới
        const payload = new TokenPayload(user._id, user.role)
        const plainPayload = { ...payload };
        const accessToken = this.jwtAccessService.sign(plainPayload);
        const refreshToken = this.jwtRefreshService.sign(plainPayload);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.refreshTokenService.createOrUpdateToken(user._id, refreshToken, expiresAt, userAgent);

        // Cập nhật lastLogin
        user.lastLogin = new Date();
        await this.userModel.updateOne({ _id: user._id }, { lastLogin: user.lastLogin }).exec();
        return { accessToken, refreshToken };
    }

    async logoutAll(userId: string): Promise<void> {
        await this.refreshTokenService.deleteAllTokensByUserId(userId);
    }

    async refreshToken(
        refreshToken: string,
        userAgent: string
    ): Promise<{ accessToken: string, newRefreshToken: string }> {
        const payload = this.jwtRefreshService.verify(refreshToken) as TokenPayload;
        if (!payload) {
            throw new Error('Invalid refresh token');
        }
        const isValid = await this.refreshTokenService.validateToken(payload.sub, userAgent,refreshToken);
        if (!isValid) {
            throw new Error('Invalid or expired refresh token');
        }
        const newPayload = new TokenPayload(payload.sub, payload.role);
        const accessToken = this.jwtAccessService.sign(newPayload.toJSON());
        const newRefreshToken = this.jwtRefreshService.sign(newPayload.toJSON());
        console.log("new",newRefreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.refreshTokenService.createOrUpdateToken(payload.sub, newRefreshToken, expiresAt, userAgent);
        return { accessToken,newRefreshToken};
    }

    /* google Oauth login
    usage: production
    @param: accessToken: string - Mã truy cập từ Google
    @returns: Promise<{accessToken: string, refreshToken: string}> - Trả về access token và refresh token
    */
    // async loginWithGoogle(accessCode: string): Promise<{accessToken: string, refreshToken: string}> {
    //     const googleUser = await this.verifyGoogleAccessToken(accessCode);
    //     if (!googleUser) {
    //         throw new Error('Invalid Google access token');
    //     }
    //     let newUser = await this.findByEmail(googleUser.email);
    //     if (!newUser) {
    //          newUser = new this.userModel({
    //             email: googleUser.email,
    //             name: googleUser.name,
    //             surName: googleUser.family_name,
    //             phone: googleUser.phone || '',
    //             password: bcrypt.hashSync(googleUser.id, 10), 
    //             avatar: googleUser.picture || 'https://res.cloudinary.com/dzuqdrb1e/image/upload/v1739074405/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-illustration-vector_yfnz21.jpg',
    //         });
    //         await newUser.save();
    //     }
    //     const payload = new TokenPayload(user._id,user.role);
    //     const accessToken = this.jwtAccessService.sign(payload);
    //     const refreshToken = this.jwtRefreshService.sign(payload);
    //     const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    //     await this.refreshTokenService.createOrUpdateToken(user._id, refreshToken, expiresAt,'google-oauth');
    //     return {accessToken, refreshToken};
    // }

    // async exchangeCodeForTokens(
    //     code: string,
    //     userAgent: string,
    // ): Promise<{ accessToken: string, refreshToken: string }> {

    //     const state = this.generateRandomState();
    //     const codeVerifier = this.generateCodeVerifier();
    //     const codeChallenge = this.generateCodeChallenge(codeVerifier);

    //     // Lưu state -> codeVerifier vào Redis hoặc Map
    //     this.redis.set(`pkce:${state}`, codeVerifier, 'EX', 300); // TTL 5 phút

    //     const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    //         `client_id=${this.clientId}` +
    //         `&redirect_uri=${this.redirectUri}` +
    //         `&response_type=code` +
    //         `&scope=openid%20profile%20email` +
    //         `&state=${state}` +
    //         `&code_challenge=${codeChallenge}` +
    //         `&code_challenge_method=S256`;

    //     // 🔁 Đây tương đương với response.sendRedirect(...) của Spring Boot
    //     return res.redirect(redirectUrl);


    // }

}
