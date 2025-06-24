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
            console.log(`🚀 Crypto API: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        });
        this.apiClient.interceptors.response.use((response) => {
            console.log(`✅ Crypto API Response: ${response.status}`);
            return response;
        }, (error) => {
            console.error(`❌ Crypto API Error: ${error.response?.status}`, error.response?.data);
            return Promise.reject(error);
        });
    }
    static async healthCheck() {
        const startTime = Date.now();
        try {
            const response = await this.apiClient.get('/v1/symbols', { timeout: 5000 });
            return {
                status: 'healthy',
                latency: Date.now() - startTime,
                details: { symbolsCount: response.data?.length || 0 }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                latency: Date.now() - startTime,
                details: { error: error.message }
            };
        }
    }
    static async getAvailableSymbols() {
        const cacheKey = 'symbols';
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        try {
            const response = await this.apiClient.get('/v1/symbols');
            const detailsResponse = await this.apiClient.get('/v1/symbols/details');
            const availableSymbols = response.data;
            const symbolsDetails = detailsResponse.data;
            const symbols = availableSymbols
                .map(symbol => symbolsDetails.find(detail => detail.symbol === symbol))
                .filter((symbol) => symbol !== undefined && symbol.status === 'open');
            this.setCache(cacheKey, symbols, 300000);
            return symbols;
        }
        catch (error) {
            console.error('Error obteniendo símbolos:', {
                message: error.message,
                response: error.response?.data,
                url: error.config?.url
            });
            const fallbackSymbols = [
                {
                    symbol: 'btcusd',
                    base_currency: 'btc',
                    quote_currency: 'usd',
                    min_order_size: '0.00001',
                    status: 'open'
                },
                {
                    symbol: 'ethusd',
                    base_currency: 'eth',
                    quote_currency: 'usd',
                    min_order_size: '0.001',
                    status: 'open'
                }
            ];
            console.warn('Usando símbolos de fallback');
            return fallbackSymbols;
        }
    }
    static async getCurrentPrice(symbol) {
        const normalizedSymbol = symbol.toLowerCase().replace(/usd$/, '') + 'usd';
        const baseSymbol = normalizedSymbol.replace(/usd$/, '');
        const cacheKey = `price_${normalizedSymbol}`;
        try {
            const isValid = await this.isValidSymbol(baseSymbol);
            if (!isValid) {
                throw new Error(`Símbolo ${baseSymbol} no soportado`);
            }
            const response = await this.apiClient.get(`/v1/pubticker/${normalizedSymbol}`, { timeout: 3000 });
            if (!response.data?.close) {
                throw new Error('Formato de respuesta inesperado');
            }
            const price = parseFloat(response.data.close);
            if (isNaN(price)) {
                throw new Error('Precio no numérico recibido');
            }
            const priceData = {
                symbol: baseSymbol.toUpperCase(),
                price: price,
                lastUpdate: new Date()
            };
            this.setCache(cacheKey, priceData, 10000);
            return priceData;
        }
        catch (error) {
            console.error(`Error obteniendo precio para ${normalizedSymbol}:`, error);
            throw new Error(`No se pudo obtener el precio de ${baseSymbol}: ${error.message}`);
        }
    }
    static async getExchangeRate(fromSymbol, toSymbol) {
        const cacheKey = `rate_${fromSymbol}_${toSymbol}`.toLowerCase();
        const cached = this.getFromCache(cacheKey);
        if (cached)
            return cached;
        try {
            if (fromSymbol.toLowerCase() === toSymbol.toLowerCase()) {
                return {
                    fromSymbol: fromSymbol.toUpperCase(),
                    toSymbol: toSymbol.toUpperCase(),
                    rate: 1,
                    timestamp: new Date()
                };
            }
            const [fromPrice, toPrice] = await Promise.all([
                this.getCurrentPrice(`${fromSymbol}usd`),
                this.getCurrentPrice(`${toSymbol}usd`)
            ]);
            const exchangeRate = {
                fromSymbol: fromSymbol.toUpperCase(),
                toSymbol: toSymbol.toUpperCase(),
                rate: fromPrice.price / toPrice.price,
                timestamp: new Date()
            };
            this.setCache(cacheKey, exchangeRate, 15000);
            return exchangeRate;
        }
        catch (error) {
            console.error(`Error obteniendo tasa ${fromSymbol}/${toSymbol}:`, error);
            throw new Error(`No se pudo obtener la tasa de cambio`);
        }
    }
    static async isValidSymbol(symbol) {
        try {
            const symbols = await this.getAvailableSymbols();
            return symbols.some(s => s.symbol.toLowerCase() === symbol.toLowerCase());
        }
        catch (error) {
            return false;
        }
    }
    static calculateExchangeAmount(fromAmount, exchangeRate) {
        return Number((fromAmount * exchangeRate).toFixed(8));
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
            return amount > 0 && amount <= 1000000;
        }
    }
    static getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }
    static setCache(key, data, ttl = this.CACHE_TTL) {
        this.cache.set(key, { data, timestamp: Date.now() });
        setTimeout(() => {
            this.cache.delete(key);
        }, ttl);
    }
    static clearCache() {
        this.cache.clear();
    }
    static getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
exports.CryptoApiService = CryptoApiService;
CryptoApiService.BASE_URL = 'https://api.gemini.com';
CryptoApiService.SANDBOX_URL = 'https://api.sandbox.gemini.com';
CryptoApiService.CACHE_TTL = 30000;
CryptoApiService.cache = new Map();
CryptoApiService.initialize();
//# sourceMappingURL=cryptoAPIService.js.map