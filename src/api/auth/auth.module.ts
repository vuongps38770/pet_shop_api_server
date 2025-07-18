import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./entity/user.entity";
import { OtpSchema } from "./models/otp.enity";

import { RefreshTokenService } from "./refresh-token.service";
import { JwtService } from "@nestjs/jwt";
import { RefreshToken, RefreshTokenSchema } from "./entity/refresh-token.entity";
import { GoogleStrategy } from "./stragery/google.stragery";
import { AppMailerModule } from "src/mailer/app-mailer.module";
import { RedisModule } from "src/redis/redis.module";


@Module({
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: 'JWT_ACCESS',
            useFactory: () => new JwtService({ secret: process.env.ACCESS_SECRET, signOptions: { expiresIn: '7d' } }),
        },
        {
            provide: 'JWT_REFRESH',
            useFactory: () => new JwtService({ secret: process.env.REFRESH_SECRET, signOptions: { expiresIn: '7d' } }),
        },
        {
            provide: RefreshTokenService,
            useClass: RefreshTokenService
        },
        GoogleStrategy
    ],
    exports: [AuthService,MongooseModule,'JWT_ACCESS'],
    imports: [
        MongooseModule.forFeature([
            {
                name: "User",
                schema: UserSchema
            },
            {
                name: "Otp",
                schema: OtpSchema
            },
            {
                name:RefreshToken.name,
                schema:RefreshTokenSchema
            }
        ]),
        AppMailerModule,
        RedisModule
    ]
})
export class AuthModule {
}