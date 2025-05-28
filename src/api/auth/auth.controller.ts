import { Body, Controller, Get, Inject, Injectable, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { UserCreateData } from "./dto/auth.dto.userCreateData";
import { RequireAuth } from "src/decorators/auth-require-decorator";
import { PartialStandardResponse } from "src/common/type/standard-api-respond-format";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {

    }
    @Get('site')
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API';
    }
    @Post('signup')
    async signUp(@Body() data: UserCreateData, @Res({ passthrough: true }) res: Response): Promise<void> {
        await this.authService.signUp(data)
        res.locals.message = 'User created successfully';
    }
    @Post('signup-test')
    async signUpTest(@Body() data: UserCreateData, @Res({ passthrough: true }) res: Response): Promise<void> {
        await this.authService.signUpTest(data)
        res.locals.message = 'User created successfully';
    }
    @Post('send-phone-otp')
    async sendPhoneOtp(@Body('phone') phone: string, @Res({ passthrough: true }) res: Response): Promise<void> {
        if (await this.authService.sendPhoneOtpToPhone(phone)) {
            res.status(200).json({
                message: 'OTP sent successfully',
            })
        }
    }
    @Post('login-phone-or-email')
    async loginWithPhone(@Body('phone') phone: string, @Body('password') password: string, @Body('userAgent') userAgent: string, @Res({ passthrough: true }) res: Response): Promise<void> {
        const { accessToken, refreshToken } = await this.authService.loginWithPhoneorEmail(phone, password, userAgent);
        if (!accessToken || !refreshToken) {
            res.status(401).json({
                message: 'Invalid phone or password',
            });
        }
        res.status(200).json({
            message: 'Login successful',
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }

    @Post("logoout_all")
    @RequireAuth()
    async logoutAll(@Body('userId') userId: string, @Res({ passthrough: true }) res: Response): Promise<void> {
        await this.authService.logoutAll(userId);
        res.status(200).json({
            message: 'Logged out from all devices successfully',
        });
    }



    @Post('refresh-token')
    async refreshToken(@Body('refreshToken') refreshToken: string, @Body('userAgent') userAgent: string, @Res({ passthrough: true }) res: Response): Promise<PartialStandardResponse<{ accessToken, refreshToken }>> {
        const { accessToken, newRefreshToken } = await this.authService.refreshToken(refreshToken, userAgent);
        if (!accessToken || !newRefreshToken) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        return {
            message: 'Token refreshed successfully',
            data: {
                accessToken: accessToken,
                refreshToken: newRefreshToken,
            }
        }
    }

    @Post('oauth/google')
    async googleAuth(@Body('accessToken') accessToken: string, @Body('userAgent') userAgent: string, @Res({ passthrough: true }) res: Response) {
        return { msg: 'Google authentication is not implemented yet' }
        // const { accessToken: newAccessToken, refreshToken } = await this.authService.loginWithGoogle(accessToken, userAgent);
        // if (!newAccessToken || !refreshToken) {
        //     res.status(401).json({
        //         message: 'Invalid Google access token',
        //     });
        //     return;
        // }
        // res.status(200).json({
        //     message: 'Google authentication successful',
        //     accessToken: newAccessToken,
        //     refreshToken: refreshToken,
        // });
    }
}