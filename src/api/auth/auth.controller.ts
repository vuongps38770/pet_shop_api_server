import { Body, Controller, Get, Inject, Injectable, Post, Req, Res } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { UserCreateData } from "./dto/auth.dto.userCreateData";
import { RequireAuth } from "src/decorators/auth-require-decorator";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService:AuthService ) {

    }
    @Get('site')
    async getSite(): Promise<string> {
        return 'Welcome to the Pet Shop API';
    }
    @Post('signup')
    async signUp(@Body() data:UserCreateData, @Res({passthrough:true}) res : Response ): Promise<void> {
        await this.authService.signUp(data)
        res.locals.message = 'User created successfully';
    }
    @Post('signup-test')
    async signUpTest(@Body() data:UserCreateData, @Res({passthrough:true}) res : Response ): Promise<void> {
        await this.authService.signUpTest(data)
        res.locals.message = 'User created successfully';
    }
    @Post('send-phone-otp')
    async sendPhoneOtp(@Body('phone') phone: string,@Res({passthrough:true})res :Response): Promise<void> {
        if(await this.authService.sendPhoneOtpToPhone(phone))
        {
            res.status(200).json({
            message: 'OTP sent successfully',
        })
        }
    }
    @Post('login-phone-or-email')
    async loginWithPhone(@Body('phone') phone: string, @Body('password') password: string,@Body('userAgent') userAgent:string, @Res({ passthrough: true }) res: Response): Promise<void> {
        const {accessToken,refreshToken} = await this.authService.loginWithPhoneorEmail(phone, password,userAgent);
        if(!accessToken || !refreshToken) {
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
}