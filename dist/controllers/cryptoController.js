"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoController = void 0;
const cryptoService_1 = require("../services/cryptoService");
exports.CryptoController = {
    getAllCryptocurrencies: async (_req, res) => {
        try {
            const cryptocurrencies = await cryptoService_1.cryptoService.getAllCryptocurrencies();
            res.json({
                message: 'Criptomonedas obtenidas exitosamente',
                data: cryptocurrencies,
                count: cryptocurrencies.length
            });
        }
        catch (error) {
            console.error('Error obteniendo todas las criptomonedas:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    getCryptocurrencyById: async (req, res) => {
        try {
            const { id } = req.params;
            const cryptoId = parseInt(id);
            if (isNaN(cryptoId)) {
                res.status(400).json({ error: 'ID de criptomoneda inválido' });
                return;
            }
            const cryptocurrency = await cryptoService_1.cryptoService.getCryptocurrencyById(cryptoId);
            if (!cryptocurrency) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Criptomoneda obtenida exitosamente',
                data: cryptocurrency
            });
        }
        catch (error) {
            console.error('Error obteniendo criptomoneda por ID:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    getCurrentPrice: async (req, res) => {
        try {
            const { symbol } = req.params;
            if (!symbol || symbol.trim().length === 0) {
                res.status(400).json({ error: 'Símbolo de criptomoneda requerido' });
                return;
            }
            const price = await cryptoService_1.cryptoService.getCurrentPrice(symbol.trim().toUpperCase());
            if (!price) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Precio actual obtenido exitosamente',
                data: price
            });
        }
        catch (error) {
            console.error('Error obteniendo precio actual:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    getCryptocurrencyBySymbol: async (req, res) => {
        try {
            const { symbol } = req.params;
            if (!symbol || symbol.trim().length === 0) {
                res.status(400).json({ error: 'Símbolo de criptomoneda requerido' });
                return;
            }
            const cryptocurrency = await cryptoService_1.cryptoService.getCryptocurrencyBySymbol(symbol);
            if (!cryptocurrency) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Criptomoneda obtenida exitosamente',
                data: cryptocurrency
            });
        }
        catch (error) {
            console.error('Error obteniendo criptomoneda por símbolo:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    getCryptocurrencyStats: async (_req, res) => {
        try {
            const stats = await cryptoService_1.cryptoService.getCryptocurrencyStats();
            res.json({
                message: 'Estadísticas obtenidas exitosamente',
                data: stats
            });
        }
        catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
};
//# sourceMappingURL=cryptoController.js.map