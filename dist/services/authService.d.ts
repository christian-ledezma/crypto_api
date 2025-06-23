import { User } from '../models/User';
interface TokenPayload {
    userId: number;
    email: string;
    username: string;
}
interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}
export declare class AuthService {
    private static readonly ACCESS_TOKEN_EXPIRY;
    private static readonly REFRESH_TOKEN_EXPIRY;
    private static readonly JWT_SECRET;
    private static readonly REFRESH_SECRET;
    static register(userData: {
        username: string;
        email: string;
        password_hash: string;
        first_name: string;
        last_name: string;
        phone?: string;
    }): Promise<LoginResponse>;
    static login(email: string, password: string): Promise<LoginResponse>;
    static findUserByEmail(email: string): Promise<User | null>;
    static findUserByUsername(username: string): Promise<User | null>;
    static generateTokens(payload: TokenPayload): AuthTokens;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): {
        userId: number;
    };
    static refreshAccessToken(refreshToken: string): Promise<AuthTokens>;
    static generateEmailVerificationToken(userId: number, email: string): string;
    static verifyEmailVerificationToken(token: string): {
        userId: number;
        email: string;
    };
    static generatePasswordResetToken(userId: number, email: string): string;
    static verifyPasswordResetToken(token: string): {
        userId: number;
        email: string;
    };
    static generateVerificationCode(): string;
    static hashVerificationCode(code: string): string;
    static verifyVerificationCode(code: string, hashedCode: string): boolean;
    static isValidTokenFormat(token: string): boolean;
    static decodeTokenWithoutVerification(token: string): any;
    static isTokenNearExpiry(token: string, thresholdMinutes?: number): boolean;
}
export {};
//# sourceMappingURL=authService.d.ts.map