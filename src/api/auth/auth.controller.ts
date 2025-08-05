import { Body, Controller, Get, Inject, Injectable, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { UserCreateData } from "./dto/auth.dto.userCreateData";
import { RequireAuth } from "src/decorators/auth-require.decorator";
import { PartialStandardResponse, StandardApiRespondSuccess } from "src/common/type/standard-api-respond-format";
import { CurrentUserId } from "src/decorators/current-user-id.decorator";
import { RawResponse } from "src/decorators/raw.decorator";
import { Public } from "../../decorators/public.decorator";
import { UserRespondDto } from "./dto/user.dto.respond";
import { AuthGuard } from "@nestjs/passport";
import { log } from "console";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { Raw } from "typeorm";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }
    @Public()
    @RawResponse()
    @Get('site')
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API';
    }

    @Public()
    @Post('signup')
    async signUp(@Body() data: UserCreateData): Promise<PartialStandardResponse<void>> {
        await this.authService.signUp(data)
        return {
            message: 'User created successfully'
        }
    }

    @Public()
    @Post('signup-test')
    async signUpTest(@Body() data: UserCreateData): Promise<PartialStandardResponse<void>> {
        await this.authService.signUpTest(data)
        return {
            message: 'User created successfully'
        }

    }
    @Public()
    @Post('check-phone')
    async checkPhone(@Body("phone") phone: string): Promise<PartialStandardResponse<void>> {
        await this.authService.checkIfExistPhone(phone)
        return {
            message: 'Your phone Number is valid!'
        }
    }

    @Public()
    @Post('send-phone-otp')
    async sendPhoneOtp(@Body('phone') phone: string): Promise<PartialStandardResponse<void>> {
        await this.authService.sendPhoneOtpToPhone(phone)
        return {
            message: "OPT sent"
        }
    }


    @Public()
    @Post('login-phone-or-email')
    async loginWithPhone(
        @Body('phone') phone: string,
        @Body('password') password: string,
        @Body('userAgent') userAgent: string,
    ): Promise<PartialStandardResponse<{ accessToken: string, refreshToken: string }>> {
        const { accessToken, refreshToken } = await this.authService.loginWithPhoneorEmail(phone, password, userAgent);
        return {
            code: 200,
            data: {
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
            message: 'Login successful'
        }
    }

    @Public()
    @Post("logout_all")
    @RequireAuth()
    async logoutAll(@Body('userId') userId: string, @Res({ passthrough: true }) res: Response): Promise<void> {
        await this.authService.logoutAll(userId);
        res.status(200).json({
            message: 'Logged out from all devices successfully',
        });
    }


    @Public()
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


    @Post('logout')
    @RequireAuth()
    async logOut(@CurrentUserId() userId: string, @Body("userAgent") userAgent: string): Promise<StandardApiRespondSuccess<void>> {
        await this.authService.logout(userId, userAgent)
        return {
            message: 'logged out',
            success: true
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


    @Public()
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAutha(@Req() req) {
    }

    @RawResponse()
    @Public()
    @Get('google/redirect')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req,@Res() res: Response) {
        log("user", req.user)
        const deeplink = await this.authService.googleAuthRedirect(req.user)
        log(deeplink)
        return res.redirect(deeplink);
    }
    
    @Post('send-otp-add-email')
    async sendOtpAddEmail(@Body('email') email: string) {
        return this.authService.sendOtpAddEmail(email);
    }

    @Post('verify-otp-add-email')
    async verifyOtpAddEmail(@CurrentUserId('userId') userId: string, @Body('email') email: string, @Body('otp') otp: string) {
        return this.authService.verifyOtpEmail(userId, email, otp);
    }

    @Public()
    @Post('send-otp-reset-password')
    async sendOtpResetPassword(@Body('email') email: string) {
        return this.authService.sendResetPasswordEmailOtp(email);
    }

    @Public()
    @Post('verify-otp-reset-password')
    async verifyOtpResetPassword(@Body('email') email: string, @Body('otp') otp: string): Promise<PartialStandardResponse<{token:string}>> {
        const data = await this.authService.verifyOtpResetEmail(otp, email);
        return {data}
    }

    @Public()
    @Post('change-password')
    async changePassword(@Body('email') email: string, @Body('password') password: string, @Body('token') token: string) {
        return this.authService.changePw(email, password, token);
    }

    
}