"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoApiService = void 0;
const axios_1 = __importDefault(require("axios"));
class CryptoApiService {
    static initialize() {
        const baseURL = process.env.NODE_ENV === 'production' ? this.BASE_URL : this.SANDBOX_URL;
        this.apiClient = axios_1.default.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'crypto-exchange-api/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('❌ API Request Error:', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            console.log(`✅ API Response: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            console.error(`❌ API Response Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
            return Promise.reject(error);
        });
    }
    static async getAvailableSymbols() {
        try {
            const cacheKey = 'symbols';
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            const response = await this.apiClient.get('/v1/symbols/details');
            const symbols = response.data.filter(symbol => symbol.status === 'open');
            this.setCache(cacheKey, symbols);
            return symbols;
        }
        catch (error) {
            console.error('Error obteniendo símbolos:', error);
            throw new Error('No se pudieron obtener los símbolos disponibles');
        }
    }
    static async getCurrentPrice(symbol) {
        try {
            const cacheKey = `price_${symbol.toLowerCase()}`;
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            const response = await this.apiClient.get(`/v1/pubticker/${symbol.toLowerCase()}`);
            const ticker = response.data;
            const priceData = {
                symbol: symbol.toUpperCase(),
                price: parseFloat(ticker.close),
                change24h: ticker.changes ? parseFloat(ticker.changes[0]) : 0,
                volume24h: 0,
                lastUpdate: new Date()
            };
            this.setCache(cacheKey, priceData, 10000);
            return priceData;
        }
        catch (error) {
            console.error(`Error obteniendo precio de ${symbol}:`, error);
            throw new Error(`No se pudo obtener el precio de ${symbol}`);
        }
    }
    static async getMultiplePrices(symbols) {
        try {
            const promises = symbols.map(symbol => this.getCurrentPrice(symbol));
            const results = await Promise.allSettled(promises);
            return results
                .filter((result) => result.status === 'fulfilled')
                .map(result => result.value);
        }
        catch (error) {
            console.error('Error obteniendo múltiples precios:', error);
            throw new Error('No se pudieron obtener todos los precios solicitados');
        }
    }
    static async getExchangeRate(fromSymbol, toSymbol) {
        try {
            const cacheKey = `rate_${fromSymbol}_${toSymbol}`.toLowerCase();
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            if (fromSymbol.toLowerCase() === toSymbol.toLowerCase()) {
                return {
                    fromSymbol: fromSymbol.toUpperCase(),
                    toSymbol: toSymbol.toUpperCase(),
                    rate: 1,
                    timestamp: new Date()
                };
            }
            const fromPrice = await this.getCurrentPrice(`${fromSymbol}usd`);
            const toPrice = await this.getCurrentPrice(`${toSymbol}usd`);
            const rate = fromPrice.price / toPrice.price;
            const exchangeRate = {
                fromSymbol: fromSymbol.toUpperCase(),
                toSymbol: toSymbol.toUpperCase(),
                rate,
                timestamp: new Date()
            };
            this.setCache(cacheKey, exchangeRate, 15000);
            return exchangeRate;
        }
        catch (error) {
            console.error(`Error obteniendo tasa de cambio ${fromSymbol}/${toSymbol}:`, error);
            throw new Error(`No se pudo obtener la tasa de cambio entre ${fromSymbol} y ${toSymbol}`);
        }
    }
    static async getOrderBook(symbol, limit = 50) {
        try {
            const cacheKey = `orderbook_${symbol.toLowerCase()}_${limit}`;
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            const response = await this.apiClient.get(`/v1/book/${symbol.toLowerCase()}`, { params: { limit_bids: limit, limit_asks: limit } });
            this.setCache(cacheKey, response.data, 5000);
            return response.data;
        }
        catch (error) {
            console.error(`Error obteniendo libro de órdenes de ${symbol}:`, error);
            throw new Error(`No se pudo obtener el libro de órdenes de ${symbol}`);
        }
    }
    static async getRecentTrades(symbol, limit = 50) {
        try {
            const cacheKey = `trades_${symbol.toLowerCase()}_${limit}`;
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            const response = await this.apiClient.get(`/v1/trades/${symbol.toLowerCase()}`, { params: { limit_trades: limit } });
            this.setCache(cacheKey, response.data, 15000);
            return response.data;
        }
        catch (error) {
            console.error(`Error obteniendo trades de ${symbol}:`, error);
            throw new Error(`No se pudieron obtener los trades recientes de ${symbol}`);
        }
    }
    static async getCandlestickData(symbol, timeframe = '1hr') {
        try {
            const cacheKey = `candles_${symbol.toLowerCase()}_${timeframe}`;
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            const response = await this.apiClient.get(`/v2/candles/${symbol.toLowerCase()}/${timeframe}`);
            const candles = response.data.map(candle => ({
                time: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5]
            }));
            const cacheDuration = timeframe === '1m' ? 60000 : 300000;
            this.setCache(cacheKey, candles, cacheDuration);
            return candles;
        }
        catch (error) {
            console.error(`Error obteniendo velas de ${symbol}:`, error);
            throw new Error(`No se pudieron obtener las velas de ${symbol}`);
        }
    }
    static async isValidSymbol(symbol) {
        try {
            const symbols = await this.getAvailableSymbols();
            return symbols.some(s => s.symbol.toLowerCase() === symbol.toLowerCase());
        }
        catch (error) {
            console.error(`Error validando símbolo ${symbol}:`, error);
            return false;
        }
    }
    static async getMarketData(symbol) {
        try {
            const [price, orderBook, recentTrades] = await Promise.all([
                this.getCurrentPrice(symbol),
                this.getOrderBook(symbol, 20),
                this.getRecentTrades(symbol, 20)
            ]);
            return { price, orderBook, recentTrades };
        }
        catch (error) {
            console.error(`Error obteniendo datos de mercado de ${symbol}:`, error);
            throw new Error(`No se pudieron obtener los datos de mercado de ${symbol}`);
        }
    }
    static calculateExchangeAmount(fromAmount, exchangeRate) {
        return fromAmount * exchangeRate;
    }
    static async validateTradingAmount(symbol, amount) {
        try {
            const symbols = await this.getAvailableSymbols();
            const symbolInfo = symbols.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
            if (!symbolInfo)
                return false;
            const minOrderSize = parseFloat(symbolInfo.min_order_size);
            return amount >= minOrderSize && amount <= 1000000;
        }
        catch (error) {
            console.error(`Error validating trading amount for ${symbol}:`, error);
            return amount > 0 && amount <= 1000000;
        }
    }
    static getFromCache(key) {
        const cached = this.priceCache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.priceCache.delete(key);
            return null;
        }
        return cached.data;
    }
    static setCache(key, data, ttl = this.CACHE_TTL) {
        this.priceCache.set(key, {
            data,
            timestamp: Date.now()
        });
        setTimeout(() => {
            this.priceCache.delete(key);
        }, ttl);
    }
    static clearCache() {
        this.priceCache.clear();
    }
    static getCacheStats() {
        return {
            size: this.priceCache.size,
            keys: Array.from(this.priceCache.keys())
        };
    }
}
exports.CryptoApiService = CryptoApiService;
CryptoApiService.BASE_URL = 'https://api.gemini.com';
CryptoApiService.SANDBOX_URL = 'https://api.sandbox.gemini.com';
CryptoApiService.CACHE_TTL = 30000;
CryptoApiService.priceCache = new Map();
CryptoApiService.initialize();
//# sourceMappingURL=cryptoAPIService.js.map