"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const cryptoAPIService_1 = require("../services/cryptoAPIService");
class HealthController {
    static async checkHealth(_req, res) {
        try {
            const healthCheck = await cryptoAPIService_1.CryptoApiService.healthCheck();
            res.status(healthCheck.status === 'healthy' ? 200 : 503).json({
                success: healthCheck.status === 'healthy',
                data: healthCheck,
                message: healthCheck.status === 'healthy'
                    ? 'API funcionando correctamente'
                    : 'API con problemas'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error verificando estado de la API',
                error: error.message
            });
        }
    }
    static async clearCache(_req, res) {
        try {
            cryptoAPIService_1.CryptoApiService.clearCache();
            res.status(200).json({
                success: true,
                message: 'Caché limpiada exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error limpiando caché',
                error: error.message
            });
        }
    }
    static async getAvailableSymbols(_req, res) {
        try {
            const symbols = await cryptoAPIService_1.CryptoApiService.getAvailableSymbols();
            const symbolsByBase = symbols.reduce((acc, symbol) => {
                const base = symbol.base_currency.toUpperCase();
                if (!acc[base]) {
                    acc[base] = [];
                }
                acc[base].push({
                    symbol: symbol.symbol,
                    quoteCurrency: symbol.quote_currency.toUpperCase(),
                    minOrderSize: symbol.min_order_size,
                    status: symbol.status
                });
                return acc;
            }, {});
            const popularPairs = symbols
                .filter(s => ['USD', 'BTC', 'EUR'].includes(s.quote_currency.toUpperCase()))
                .slice(0, 20)
                .map(s => ({
                symbol: s.symbol,
                baseCurrency: s.base_currency.toUpperCase(),
                quoteCurrency: s.quote_currency.toUpperCase(),
                minOrderSize: s.min_order_size
            }));
            res.status(200).json({
                success: true,
                data: {
                    total: symbols.length,
                    popular: popularPairs,
                    byBaseCurrency: symbolsByBase,
                    examples: {
                        bitcoin: 'btcusd',
                        ethereum: 'ethusd',
                        litecoin: 'ltcusd',
                        cardano: 'adausd'
                    }
                },
                message: 'Símbolos obtenidos exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error getting available symbols:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo símbolos disponibles',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.HealthController = HealthController;
//# sourceMappingURL=healthController.js.map