import { HttpCode, HttpStatus, Inject, Injectable, Logger, OnModuleInit, Res } from "@nestjs/common";
import { Response } from 'express';
import { InjectModel } from "@nestjs/mongoose";
import { User } from "./entity/user.entity";
import { Document, Model, Types } from "mongoose";
import { UserCreateData } from "./dto/auth.dto.userCreateData";
import * as bcrypt from 'bcryptjs';
import { Otp } from "./models/otp.enity";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokenService } from "./refresh-token.service";
import { TokenPayload } from "./models/token-payload";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";
import { AppException } from "src/common/exeptions/app.exeption";
import { UserRespondDto } from "./dto/user.dto.respond";
import { TimeLimit } from "src/constants/TimeLimit";
import { UserRole } from "./models/role.enum";
import { AppMailerService } from "src/mailer/mailer.service";
import { RedisClient } from "src/redis/redis.provider";
import Redis from "ioredis";
import { ApiErrorStatus } from "src/constants/api.error.keys";

@Injectable()
export class AuthService implements OnModuleInit {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        @InjectModel('Otp') private readonly otpModel: Model<Otp>,
        private readonly refreshTokenService: RefreshTokenService,
        @Inject('JWT_ACCESS') private readonly jwtAccessService: JwtService,
        @Inject('JWT_REFRESH') private readonly jwtRefreshService: JwtService,
        private readonly appMailerService: AppMailerService,
        @Inject(RedisClient) private readonly redis: Redis
    ) { }




    async onModuleInit() {
        console.log('Syncing indexes for Category collection...');
        await this.userModel.syncIndexes();
        console.log('Indexes synced!');
    }


    /*
    signUp thong thuong qua sdt
    usage: production
    @param: data: UserCreateData - Thông tin người dùng mới
    @returns: Promise<User> - Trả về người dùng mới đã được tạo
    */
    async signUp(data: UserCreateData): Promise<User> {
        if (!data.name || !data.surName || !data.password || !data.phone || !data.otpCode) {
            throw new AppException('Missing required fields: surName, name, phone, or password', HttpStatus.BAD_REQUEST);
        }
        // if (!data.password || data.password.length < 6) {
        //     throw new Error('Password must be at least 6 characters long');
        // }
        if (data.otpCode) {
            // Kiểm tra OTP trước khi tạo người dùng
            const isOtpValid = await this.checkPhoneOtp(data.phone, data.otpCode);
            if (!isOtpValid) {
                throw new AppException('Invalid OTP', HttpStatus.UNAUTHORIZED);
            }
        }
        const existingUser = await this.findByPhone(data.phone);
        if (existingUser) {
            throw new AppException('User with this phone number already exists', HttpStatus.CONFLICT);
        }
        data.password = bcrypt.hashSync(data.password, 10);
        const newUser = new this.userModel(data);
        return await newUser.save();
    }



    async checkIfExistPhone(phone: string) {
        const existingUser = await this.findByPhone(phone);
        if (existingUser) {
            throw new AppException('User with this phone number already exists', HttpStatus.CONFLICT, "PHONE_EXISTED");
        }
    }


    async validateUser(userId: string): Promise<void> {
        const user = await this.userModel.findById(new Types.ObjectId(userId));
        if (!user) {
            throw new AppException('User not found', 404, "USER_NOT_FOUND");
        }


    }

    /*
    signUp thong thuong qua sdt
    usage: test (ko can otp)
    @param: data: UserCreateData - Thông tin người dùng mới
    @returns: Promise<User> - Trả về người dùng mới đã được tạo
    */
    async signUpTest(data: UserCreateData): Promise<User> {
        if (!data.name || !data.surName || !data.password || !data.phone) {
            throw new AppException('Missing required fields: surName, name, phone, or password', HttpStatus.BAD_REQUEST);

        }
        const existingUser = await this.findByPhone(data.phone);
        if (existingUser) {
            throw new AppException('User with this phone number already exists', HttpStatus.CONFLICT);
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
        await this.checkIfExistPhone(phone)
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
            Logger.error(JSON.stringify(response) || "")
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
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const otpCode = await this.otpModel.create(
            {
                phone,
                otp,
                expiresAt
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
            throw new AppException('Invalid OTP or phone number', 400, 'INVALID_OTP');
        }
        const currentTime = new Date();
        if (otpRecord.expiresAt && otpRecord.expiresAt < currentTime) {
            throw new AppException('OTP has expired', 400, 'EXPIRED_OTP');
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
        if (!password || !phoneOrEmail || !userAgent) {
            throw new AppException('email/phone/password is missing!', HttpStatus.BAD_REQUEST);
        }
        const user = await this.findByPhone(phoneOrEmail) || await this.findByEmail(phoneOrEmail);
        if (!user) {
            throw new AppException('Invalid email/phone/password', HttpStatus.UNAUTHORIZED);
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            throw new AppException('Invalid email/phone/password', HttpStatus.UNAUTHORIZED);
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
        if (!refreshToken) {
            throw new AppException(
                'Refresh token is required',
                400);
        }

        const payload = this.jwtRefreshService.verify(refreshToken) as TokenPayload;
        if (!payload) {
            throw new AppException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
        }
        await this.refreshTokenService.validateToken(payload.sub, userAgent, refreshToken);

        const newPayload = new TokenPayload(payload.sub, payload.role);
        const accessToken = this.jwtAccessService.sign(newPayload.toJSON());
        const newRefreshToken = this.jwtRefreshService.sign(newPayload.toJSON());
        console.log("new", newRefreshToken);
        const expiresAt = new Date(Date.now() + TimeLimit["7Days"]);
        await this.refreshTokenService.createOrUpdateToken(payload.sub, newRefreshToken, expiresAt, userAgent);
        return { accessToken, newRefreshToken };


    }

    async logout(userId: string, userAgent: string): Promise<void> {
        await this.refreshTokenService.logOut(userId, userAgent)
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


    async getUserInfo(userId: string): Promise<UserRespondDto> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new AppException("User not found", HttpStatus.NOT_FOUND);
        }
        return {
            email: user.email,
            name: user.name,
            surName: user.surName,
            phone: user.phone,
            avatar: user.avatar
        }
    }


    async googleAuthRedirect(user: any) {
        if (!user || !user.email) return ""
        const exist = await this.userModel.findOne({ email: user.email }).lean();
        if (exist) {
            return this.generateTokensAndReturnLink(exist, user.userAgent)
        } else {
            const userCreate = await this.userModel.create({
                avatar: user.picture || undefined,
                email: user.email,
                name: user.lastName,
                surName: user.firstName,
                lastLogin: Date.now(),
                createdAt: Date.now(),
                role: UserRole.USER,
                updatedAt: Date.now(),
                provider: 'google'
            })
            await userCreate.save()
            return this.generateTokensAndReturnLink(userCreate, user.userAgent)
        }

    }

    private async generateTokensAndReturnLink(user: User, userAgent: string) {
        const payload = new TokenPayload(user._id, user.role);
        const accessToken = this.jwtAccessService.sign(payload.toJSON());
        const newRefreshToken = this.jwtRefreshService.sign(payload.toJSON());
        const expiresAt = new Date(Date.now() + TimeLimit["7Days"]);
        await this.refreshTokenService.createOrUpdateToken(payload.sub, newRefreshToken, expiresAt, userAgent);
        await this.userModel.updateOne({ _id: user._id }, { lastLogin: new Date() });
        return `petshop://login?accessToken=${accessToken}&refreshToken=${newRefreshToken}`;
    }



    
    //tao otp cho tai khoan muon them email vao
    async sendOtpAddEmail(email: string) {
        const exist = await this.userModel.findOne({ email })
        if (exist) throw new AppException('Email đã tồn tại', HttpStatus.CONFLICT, ApiErrorStatus.EMAIL_EXISTED)
        const { expiresInMinutes, otp } = this.createMailOtp(email)
        await this.sendOtpToMail(email, otp, expiresInMinutes)
        await this.redis.set(`otp:change-email:${email}`,otp)
    }
    // xac thuc otp khi nguoi dung them email va luu vao tk
    async verifyOtpEmail(userId: string, email: string, token: string) {
        const cachedToken = await this.redis.get(`otp:change-email:${email}`);
        if (!cachedToken || cachedToken !== token) {
            throw new AppException('Token không hợp lệ hoặc đã hết hạn', HttpStatus.BAD_REQUEST, ApiErrorStatus.TOKEN_INVALID);
        }
        const user = await this.userModel.findById(userId)
        if (!user) throw new AppException('User không tồn tại', HttpStatus.NOT_FOUND, ApiErrorStatus.USER_NOT_FOUND);
        user.email = email
        await user.save();
        await this.redis.del(`otp:change-email:${email}`);
        return { success: true };
    }









    //gui otp toi email muon reset mk
    async sendResetPasswordEmailOtp(email: string) {
        const exist = await this.userModel.findOne({ email })
        if (!exist) throw new AppException('Email không tồn tại', HttpStatus.NOT_FOUND, ApiErrorStatus.EMAIL_NOT_FOUND)
        if (exist.provider != null && exist.provider != undefined && exist.provider != undefined) {
            throw new AppException('Email dùng để đăng nhập Oauth', HttpStatus.CONFLICT, ApiErrorStatus.OAUTH_ACCOUNT_ERR)
        }
        const { expiresInMinutes, otp } = this.createMailOtp(email)
        await this.sendOtpToMail(email, otp, expiresInMinutes)
        await this.redis.set(`otp:${email}`,otp);
    }

    // xac thuc otp cho email muon doi mk
    async verifyOtpResetEmail(otp: string, email: string) {
        const cachedOtp = await this.redis.get(`otp:${email}`);
        if (!cachedOtp || cachedOtp !== otp) {
            throw new AppException('OTP không hợp lệ hoặc đã hết hạn', HttpStatus.BAD_REQUEST, ApiErrorStatus.OTP_INVALID);
        }
        await this.redis.del(`otp:${email}`);
        const token = Math.random().toString(36).substring(2) + Date.now();
        await this.redis.set(`reset-token:${email}`, token, 'EX', 600);
        return { token };
    }



    async changePw(email: string, pw: string, token: string) {
        const cachedToken = await this.redis.get(`reset-token:${email}`);
        if (!cachedToken || cachedToken !== token) {
            throw new AppException('Token không hợp lệ hoặc đã hết hạn', HttpStatus.BAD_REQUEST, ApiErrorStatus.TOKEN_INVALID);
        }
        const user = await this.userModel.findOne({ email });
        if (!user) throw new AppException('User không tồn tại', HttpStatus.NOT_FOUND, ApiErrorStatus.USER_NOT_FOUND);
        user.password = await bcrypt.hash(pw, 10);
        await user.save();
        await this.redis.del(`reset-token:${email}`);
        return { success: true };
    }





    private createMailOtp(email: string) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresInMinutes = 1;
        return { email, otp, expiresInMinutes };
    }
    async sendOtpToMail(email: string, otp: string, expiresInMinutes: number) {
        await this.appMailerService.sendOtpEmail(email, otp, expiresInMinutes);
    }
}