interface GeminiSymbol {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    min_order_size: string;
    status: string;
}
interface CryptoPriceData {
    symbol: string;
    price: number;
    lastUpdate: Date;
}
interface ExchangeRateData {
    fromSymbol: string;
    toSymbol: string;
    rate: number;
    timestamp: Date;
}
export declare class CryptoApiService {
    private static readonly BASE_URL;
    private static readonly SANDBOX_URL;
    private static apiClient;
    private static readonly CACHE_TTL;
    private static cache;
    static initialize(): void;
    static healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        latency: number;
        details: any;
    }>;
    static getAvailableSymbols(): Promise<GeminiSymbol[]>;
    static getCurrentPrice(symbol: string): Promise<CryptoPriceData>;
    static getExchangeRate(fromSymbol: string, toSymbol: string): Promise<ExchangeRateData>;
    static isValidSymbol(symbol: string): Promise<boolean>;
    static calculateExchangeAmount(fromAmount: number, exchangeRate: number): number;
    static validateTradingAmount(symbol: string, amount: number): Promise<boolean>;
    private static getFromCache;
    private static setCache;
    static clearCache(): void;
    static getCacheStats(): {
        size: number;
        keys: string[];
    };
}
export {};
//# sourceMappingURL=cryptoAPIService.d.ts.map