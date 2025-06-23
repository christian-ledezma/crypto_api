interface GeminiSymbol {
    symbol: string;
    base_currency: string;
    quote_currency: string;
    tick_size: number;
    quote_increment: number;
    min_order_size: string;
    status: string;
    wrap_enabled: boolean;
}
interface GeminiOrderBook {
    bids: Array<{
        price: string;
        amount: string;
        timestamp?: string;
    }>;
    asks: Array<{
        price: string;
        amount: string;
        timestamp?: string;
    }>;
}
interface GeminiTrade {
    timestamp: number;
    timestampms: number;
    tid: number;
    price: string;
    amount: string;
    exchange: string;
    type: 'buy' | 'sell';
}
interface GeminiCandle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
interface CryptoPriceData {
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
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
    private static priceCache;
    static initialize(): void;
    static getAvailableSymbols(): Promise<GeminiSymbol[]>;
    static getCurrentPrice(symbol: string): Promise<CryptoPriceData>;
    static getMultiplePrices(symbols: string[]): Promise<CryptoPriceData[]>;
    static getExchangeRate(fromSymbol: string, toSymbol: string): Promise<ExchangeRateData>;
    static getOrderBook(symbol: string, limit?: number): Promise<GeminiOrderBook>;
    static getRecentTrades(symbol: string, limit?: number): Promise<GeminiTrade[]>;
    static getCandlestickData(symbol: string, timeframe?: '1m' | '5m' | '15m' | '30m' | '1hr' | '6hr' | '1day'): Promise<GeminiCandle[]>;
    static isValidSymbol(symbol: string): Promise<boolean>;
    static getMarketData(symbol: string): Promise<{
        price: CryptoPriceData;
        orderBook: GeminiOrderBook;
        recentTrades: GeminiTrade[];
    }>;
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