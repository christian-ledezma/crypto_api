"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeController = void 0;
const exchangeService_1 = require("../services/exchangeService");
class ExchangeController {
    static async getUserExchanges(req, res) {
        try {
            const userId = req.user?.id;
            const { limit = '50', offset = '0' } = req.query;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchanges = await exchangeService_1.ExchangeService.getUserExchanges(userId, parseInt(limit), parseInt(offset));
            res.status(200).json({
                exchanges,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: exchanges.length
                }
            });
        }
        catch (error) {
            console.error('Error en getUserExchanges:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async getSentExchanges(req, res) {
        try {
            const userId = req.user?.id;
            const { limit = '50', offset = '0' } = req.query;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchanges = await exchangeService_1.ExchangeService.getUserSentExchanges(userId, parseInt(limit), parseInt(offset));
            res.status(200).json({
                exchanges,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: exchanges.length
                }
            });
        }
        catch (error) {
            console.error('Error en getSentExchanges:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async getReceivedExchanges(req, res) {
        try {
            const userId = req.user?.id;
            const { limit = '50', offset = '0' } = req.query;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchanges = await exchangeService_1.ExchangeService.getUserReceivedExchanges(userId, parseInt(limit), parseInt(offset));
            res.status(200).json({
                exchanges,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: exchanges.length
                }
            });
        }
        catch (error) {
            console.error('Error en getReceivedExchanges:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async getExchangeById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            if (!id) {
                res.status(400).json({
                    error: 'ID de intercambio requerido'
                });
                return;
            }
            const exchange = await exchangeService_1.ExchangeService.getExchangeById(parseInt(id));
            if (!exchange) {
                res.status(404).json({
                    error: 'Intercambio no encontrado'
                });
                return;
            }
            if (exchange.from_user_id !== userId && exchange.to_user_id !== userId) {
                res.status(403).json({
                    error: 'No tienes permisos para ver este intercambio'
                });
                return;
            }
            res.status(200).json({
                exchange
            });
        }
        catch (error) {
            console.error('Error en getExchangeById:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async createExchange(req, res) {
        try {
            const { toUserId, fromCurrencyId, toCurrencyId, fromAmount } = req.body;
            const fromUserId = req.user?.id;
            if (!fromUserId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchange = await exchangeService_1.ExchangeService.createExchange({
                fromUserId,
                toUserId: parseInt(toUserId),
                fromCurrencyId: parseInt(fromCurrencyId),
                toCurrencyId: parseInt(toCurrencyId),
                fromAmount: parseFloat(fromAmount)
            });
            res.status(201).json({
                message: 'Intercambio creado exitosamente',
                exchange
            });
        }
        catch (error) {
            console.error('Error en createExchange:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchangeId = parseInt(id);
            const exchange = await exchangeService_1.ExchangeService.getExchangeById(exchangeId);
            if (!exchange) {
                res.status(404).json({
                    error: 'Intercambio no encontrado'
                });
                return;
            }
            if (exchange.from_user_id !== userId && exchange.to_user_id !== userId) {
                res.status(403).json({
                    error: 'No tienes permisos para modificar este intercambio'
                });
                return;
            }
            let updatedExchange;
            switch (status) {
                case 'completed':
                    if (exchange.to_user_id !== userId) {
                        res.status(403).json({
                            error: 'Solo el usuario destinatario puede aceptar el intercambio'
                        });
                        return;
                    }
                    updatedExchange = await exchangeService_1.ExchangeService.processExchange(exchangeId);
                    break;
                case 'failed':
                    updatedExchange = await exchangeService_1.ExchangeService.cancelExchange(exchangeId, userId);
                    break;
                default:
                    res.status(400).json({
                        error: 'Estado inválido. Valores permitidos: completed, failed'
                    });
                    return;
            }
            res.status(200).json({
                message: 'Estado del intercambio actualizado exitosamente',
                exchange: updatedExchange
            });
        }
        catch (error) {
            console.error('Error en updateStatus:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async acceptExchange(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchangeId = parseInt(id);
            const exchange = await exchangeService_1.ExchangeService.getExchangeById(exchangeId);
            if (!exchange) {
                res.status(404).json({
                    error: 'Intercambio no encontrado'
                });
                return;
            }
            if (exchange.to_user_id !== userId) {
                res.status(403).json({
                    error: 'Solo el usuario destinatario puede aceptar el intercambio'
                });
                return;
            }
            if (exchange.status !== 'pending') {
                res.status(400).json({
                    error: 'Solo se pueden aceptar intercambios pendientes'
                });
                return;
            }
            const processedExchange = await exchangeService_1.ExchangeService.processExchange(exchangeId);
            res.status(200).json({
                message: 'Intercambio aceptado y procesado exitosamente',
                exchange: processedExchange
            });
        }
        catch (error) {
            console.error('Error en acceptExchange:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
    static async rejectExchange(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    error: 'Usuario no autenticado'
                });
                return;
            }
            const exchangeId = parseInt(id);
            const exchange = await exchangeService_1.ExchangeService.getExchangeById(exchangeId);
            if (!exchange) {
                res.status(404).json({
                    error: 'Intercambio no encontrado'
                });
                return;
            }
            if (exchange.to_user_id !== userId) {
                res.status(403).json({
                    error: 'Solo el usuario destinatario puede rechazar el intercambio'
                });
                return;
            }
            if (exchange.status !== 'pending') {
                res.status(400).json({
                    error: 'Solo se pueden rechazar intercambios pendientes'
                });
                return;
            }
            const cancelledExchange = await exchangeService_1.ExchangeService.cancelExchange(exchangeId, userId);
            res.status(200).json({
                message: 'Intercambio rechazado exitosamente',
                exchange: cancelledExchange
            });
        }
        catch (error) {
            console.error('Error en rejectExchange:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    }
}
exports.ExchangeController = ExchangeController;
//# sourceMappingURL=exchangeController.js.map