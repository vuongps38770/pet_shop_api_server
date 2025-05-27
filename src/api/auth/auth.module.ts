import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./models/user.entity";
import { OtpSchema } from "./models/otp.enity";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { RefreshToken, RefreshTokenSchema } from "./models/refresh-token.entity";
import { RefreshTokenService } from "./refresh-token.service";

@Module({
    controllers: [AuthController],
    providers: [AuthService,
        {
            provide: 'JWT_ACCESS',
            useFactory: () => new JwtService({ secret: process.env.ACCESS_SECRET, signOptions: { expiresIn: '15m' } }),
        },
        {
            provide: 'JWT_REFRESH',
            useFactory: () => new JwtService({ secret: process.env.REFRESH_SECRET, signOptions: { expiresIn: '7d' } }),
        },
        {
            provide: RefreshTokenService,
            useClass: RefreshTokenService
        }
    ],
    exports: [AuthService],
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
    ]
})
export class AuthModule {
}