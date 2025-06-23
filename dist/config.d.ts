interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    DB_SSL_ENABLED?: boolean;
}
interface Config {
    database: DatabaseConfig;
    server: {
        port: number;
        nodeEnv: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    security: {
        bcryptRounds: number;
        jwtSecret?: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    cryptoApi: {
        url: string;
        key?: string;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=config.d.ts.map