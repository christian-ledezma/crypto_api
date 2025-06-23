"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'crypto_exchange',
        DB_SSL_ENABLED: process.env.DB_SSL_ENABLED === 'true',
    },
    server: {
        port: parseInt(process.env.PORT || '3000'),
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    cryptoApi: {
        url: process.env.CRYPTO_API_URL || 'https://docs.gemini.com/rest/market-data ',
        key: process.env.CRYPTO_API_KEY
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
        jwtSecret: process.env.JWT_SECRET
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    },
};
exports.default = config;
//# sourceMappingURL=config.js.map