// import { PassportStrategy } from "@nestjs/passport";
// import { Profile } from "passport";
// import { Strategy } from "passport-google-oauth20";
// export class GoogleStrategy extends PassportStrategy(Strategy){

//     constructor() {
//         super({
//             clientID: process.env.GOOGLE_CLIENT_ID || "",
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
//             callbackURL: process.env.GOOGLE_CALLBACK_URL || "",
//             passReqToCallback: true,
//             scope: ['email', 'profile'],
//         });
//     }
//     async validate(
//         accessToken: string,
//         refreshToken: string,
//         profile: Profile,
//         done: Function
//     ) {
//         try {
//             const user = {
//                 email: profile.emails?.values()||"",
//                 firstName: profile.name?.givenName||"",
//                 lastName: profile.name?.familyName||"",
//                 picture: profile.displayName||"",
//             };
//             done(null, user);
//         } catch (error) {
//             done(error, false);
//         }
//     }
// }