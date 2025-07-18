import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { log } from "console";
import { Request } from "express";
import { Profile } from "passport";
import { Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
    ) {
        super({
            clientID: configService.getOrThrow<string>('OAUTH2_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('OAUTH2_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('OAUTH2_REDIRECT_URI'),
            passReqToCallback: true,
            scope: ['email', 'profile'],
        });
    }
    async validate(
        request: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile
    ): Promise<any> {
        const deviceCode = request.query?.state;
        log(deviceCode)
        const user = {
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            picture: profile.photos?.[0]?.value || '',
            userAgent: deviceCode
        };
        log(user)
        return user;
    }
}