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
    getActiveCryptocurrencies: async (_req, res) => {
        try {
            const cryptocurrencies = await cryptoService_1.cryptoService.getActiveCryptocurrencies();
            res.json({
                message: 'Criptomonedas activas obtenidas exitosamente',
                data: cryptocurrencies,
                count: cryptocurrencies.length
            });
        }
        catch (error) {
            console.error('Error obteniendo criptomonedas activas:', error);
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
    createCryptocurrency: async (req, res) => {
        try {
            const { symbol, name, is_active } = req.body;
            if (!symbol || !name) {
                res.status(400).json({
                    error: 'Símbolo y nombre son requeridos',
                    required_fields: ['symbol', 'name']
                });
                return;
            }
            if (symbol.length > 10) {
                res.status(400).json({ error: 'El símbolo no puede tener más de 10 caracteres' });
                return;
            }
            if (name.length > 25) {
                res.status(400).json({ error: 'El nombre no puede tener más de 25 caracteres' });
                return;
            }
            const cryptocurrencyData = {
                symbol: symbol.trim().toUpperCase(),
                name: name.trim(),
                is_active: is_active !== undefined ? Boolean(is_active) : true
            };
            const newCryptocurrency = await cryptoService_1.cryptoService.createCryptocurrency(cryptocurrencyData);
            res.status(201).json({
                message: 'Criptomoneda creada exitosamente',
                data: newCryptocurrency
            });
        }
        catch (error) {
            console.error('Error creando criptomoneda:', error);
            if (error instanceof Error) {
                if (error.message.includes('Ya existe una criptomoneda')) {
                    res.status(409).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    updateCryptocurrency: async (req, res) => {
        try {
            const { id } = req.params;
            const cryptoId = parseInt(id);
            if (isNaN(cryptoId)) {
                res.status(400).json({ error: 'ID de criptomoneda inválido' });
                return;
            }
            const { symbol, name, is_active } = req.body;
            if (symbol && symbol.length > 10) {
                res.status(400).json({ error: 'El símbolo no puede tener más de 10 caracteres' });
                return;
            }
            if (name && name.length > 25) {
                res.status(400).json({ error: 'El nombre no puede tener más de 25 caracteres' });
                return;
            }
            const updateData = {};
            if (symbol !== undefined)
                updateData.symbol = symbol.trim().toUpperCase();
            if (name !== undefined)
                updateData.name = name.trim();
            if (is_active !== undefined)
                updateData.is_active = Boolean(is_active);
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ error: 'No hay datos para actualizar' });
                return;
            }
            const updatedCryptocurrency = await cryptoService_1.cryptoService.updateCryptocurrency(cryptoId, updateData);
            if (!updatedCryptocurrency) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Criptomoneda actualizada exitosamente',
                data: updatedCryptocurrency
            });
        }
        catch (error) {
            console.error('Error actualizando criptomoneda:', error);
            if (error instanceof Error) {
                if (error.message.includes('Ya existe una criptomoneda')) {
                    res.status(409).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    deactivateCryptocurrency: async (req, res) => {
        try {
            const { id } = req.params;
            const cryptoId = parseInt(id);
            if (isNaN(cryptoId)) {
                res.status(400).json({ error: 'ID de criptomoneda inválido' });
                return;
            }
            const success = await cryptoService_1.cryptoService.deactivateCryptocurrency(cryptoId);
            if (!success) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Criptomoneda desactivada exitosamente'
            });
        }
        catch (error) {
            console.error('Error desactivando criptomoneda:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    },
    activateCryptocurrency: async (req, res) => {
        try {
            const { id } = req.params;
            const cryptoId = parseInt(id);
            if (isNaN(cryptoId)) {
                res.status(400).json({ error: 'ID de criptomoneda inválido' });
                return;
            }
            const success = await cryptoService_1.cryptoService.activateCryptocurrency(cryptoId);
            if (!success) {
                res.status(404).json({ error: 'Criptomoneda no encontrada' });
                return;
            }
            res.json({
                message: 'Criptomoneda activada exitosamente'
            });
        }
        catch (error) {
            console.error('Error activando criptomoneda:', error);
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