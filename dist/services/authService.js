"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const userService_1 = require("./userService");
class AuthService {
    static async register(userData) {
        try {
            const user = await userService_1.UserService.createUser(userData);
            const tokens = this.generateTokens({
                userId: user.id,
                email: user.email,
                username: user.username
            });
            return {
                user,
                tokens
            };
        }
        catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }
    static async login(email, password) {
        try {
            const userWithPassword = await userService_1.UserService.getUserWithPassword(email);
            if (!userWithPassword) {
                throw new Error('Credenciales inválidas');
            }
            const isValidPassword = await userService_1.UserService.verifyPassword(password, userWithPassword.password_hash);
            if (!isValidPassword) {
                throw new Error('Credenciales inválidas');
            }
            const user = {
                id: userWithPassword.id,
                username: userWithPassword.username,
                email: userWithPassword.email,
                password_hash: userWithPassword.password_hash,
                first_name: userWithPassword.first_name,
                last_name: userWithPassword.last_name,
                phone: userWithPassword.phone,
                email_verified: userWithPassword.email_verified,
                created_at: userWithPassword.created_at,
                updated_at: userWithPassword.updated_at
            };
            const tokens = this.generateTokens({
                userId: user.id,
                email: user.email,
                username: user.username
            });
            return {
                user,
                tokens
            };
        }
        catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }
    static async findUserByEmail(email) {
        try {
            const user = await userService_1.UserService.getUserByEmail(email);
            return user || null;
        }
        catch (error) {
            console.error('Error buscando usuario por email:', error);
            throw new Error('Error al buscar usuario por email');
        }
    }
    static async findUserByUsername(username) {
        try {
            const user = await userService_1.UserService.getUserByUsername(username);
            return user || null;
        }
        catch (error) {
            console.error('Error buscando usuario por username:', error);
            throw new Error('Error al buscar usuario por username');
        }
    }
    static generateTokens(payload) {
        try {
            const accessToken = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: this.ACCESS_TOKEN_EXPIRY,
                issuer: 'crypto-exchange-api',
                audience: 'crypto-exchange-users'
            });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, this.REFRESH_SECRET, {
                expiresIn: this.REFRESH_TOKEN_EXPIRY,
                issuer: 'crypto-exchange-api',
                audience: 'crypto-exchange-users'
            });
            return {
                accessToken,
                refreshToken,
                expiresIn: 15 * 60
            };
        }
        catch (error) {
            console.error('Error generando tokens:', error);
            throw new Error('Error al generar tokens de autenticación');
        }
    }
    static verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET, {
                issuer: 'crypto-exchange-api',
                audience: 'crypto-exchange-users'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token de acceso expirado');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Token de acceso inválido');
            }
            else {
                throw new Error('Error verificando token de acceso');
            }
        }
    }
    static verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.REFRESH_SECRET, {
                issuer: 'crypto-exchange-api',
                audience: 'crypto-exchange-users'
            });
            return decoded;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token de refresh expirado');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Token de refresh inválido');
            }
            else {
                throw new Error('Error verificando token de refresh');
            }
        }
    }
    static async refreshAccessToken(refreshToken) {
        try {
            const decoded = this.verifyRefreshToken(refreshToken);
            const user = await userService_1.UserService.getUserById(decoded.userId);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            const tokens = this.generateTokens({
                userId: user.id,
                email: user.email,
                username: user.username
            });
            return tokens;
        }
        catch (error) {
            console.error('Error refrescando token:', error);
            throw error;
        }
    }
    static generateEmailVerificationToken(userId, email) {
        try {
            const payload = {
                userId,
                email,
                type: 'email_verification',
                timestamp: Date.now()
            };
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: '24h',
                issuer: 'crypto-exchange-api'
            });
        }
        catch (error) {
            console.error('Error generando token de verificación:', error);
            throw new Error('Error al generar token de verificación');
        }
    }
    static verifyEmailVerificationToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET, {
                issuer: 'crypto-exchange-api'
            });
            if (decoded.type !== 'email_verification') {
                throw new Error('Tipo de token inválido');
            }
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token de verificación expirado');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Token de verificación inválido');
            }
            else {
                throw error;
            }
        }
    }
    static generatePasswordResetToken(userId, email) {
        try {
            const payload = {
                userId,
                email,
                type: 'password_reset',
                timestamp: Date.now()
            };
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: '1h',
                issuer: 'crypto-exchange-api'
            });
        }
        catch (error) {
            console.error('Error generando token de reset:', error);
            throw new Error('Error al generar token de reset');
        }
    }
    static verifyPasswordResetToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET, {
                issuer: 'crypto-exchange-api'
            });
            if (decoded.type !== 'password_reset') {
                throw new Error('Tipo de token inválido');
            }
            return {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Token de reset expirado');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Token de reset inválido');
            }
            else {
                throw error;
            }
        }
    }
    static generateVerificationCode() {
        return crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    }
    static hashVerificationCode(code) {
        return crypto_1.default.createHash('sha256').update(code).digest('hex');
    }
    static verifyVerificationCode(code, hashedCode) {
        const hashedInput = this.hashVerificationCode(code);
        return hashedInput === hashedCode;
    }
    static isValidTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        const parts = token.split('.');
        return parts.length === 3;
    }
    static decodeTokenWithoutVerification(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    }
    static isTokenNearExpiry(token, thresholdMinutes = 5) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const now = Math.floor(Date.now() / 1000);
            const threshold = thresholdMinutes * 60;
            return (decoded.exp - now) < threshold;
        }
        catch (error) {
            return true;
        }
    }
}
exports.AuthService = AuthService;
AuthService.ACCESS_TOKEN_EXPIRY = '15m';
AuthService.REFRESH_TOKEN_EXPIRY = '7d';
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
AuthService.REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
//# sourceMappingURL=authService.js.map