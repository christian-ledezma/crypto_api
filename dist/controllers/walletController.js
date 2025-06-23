"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const walletService_1 = require("../services/walletService");
exports.WalletController = {
    getUserWallets: async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: 'ID de usuario inválido' });
                return;
            }
            const wallets = await walletService_1.walletService.getUserWallets(userId);
            res.json({
                message: 'Wallets obtenidas exitosamente',
                wallets,
                count: wallets.length
            });
        }
        catch (error) {
            console.error('Error obteniendo wallets del usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getWallet: async (req, res) => {
        try {
            const walletId = parseInt(req.params.id);
            if (isNaN(walletId)) {
                res.status(400).json({ error: 'ID de wallet inválido' });
                return;
            }
            const wallet = await walletService_1.walletService.getWallet(walletId);
            if (!wallet) {
                res.status(404).json({ error: 'Wallet no encontrada' });
                return;
            }
            res.json({
                message: 'Wallet obtenida exitosamente',
                wallet
            });
        }
        catch (error) {
            console.error('Error obteniendo wallet:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getUserWalletForCrypto: async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const cryptoId = parseInt(req.params.cryptoId);
            if (isNaN(userId) || isNaN(cryptoId)) {
                res.status(400).json({ error: 'IDs inválidos' });
                return;
            }
            const wallet = await walletService_1.walletService.getUserWalletForCrypto(userId, cryptoId);
            if (!wallet) {
                res.status(404).json({
                    error: 'Wallet no encontrada para esta criptomoneda',
                    message: 'El usuario no tiene una wallet para esta criptomoneda'
                });
                return;
            }
            res.json({
                message: 'Wallet obtenida exitosamente',
                wallet
            });
        }
        catch (error) {
            console.error('Error obteniendo wallet por criptomoneda:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    createWallet: async (req, res) => {
        try {
            const { userId, cryptocurrencyId } = req.body;
            if (!userId || !cryptocurrencyId) {
                res.status(400).json({
                    error: 'Datos requeridos faltantes',
                    required: ['userId', 'cryptocurrencyId']
                });
                return;
            }
            if (isNaN(parseInt(userId)) || isNaN(parseInt(cryptocurrencyId))) {
                res.status(400).json({ error: 'Los IDs deben ser números válidos' });
                return;
            }
            const newWallet = await walletService_1.walletService.createWallet(parseInt(userId), parseInt(cryptocurrencyId));
            res.status(201).json({
                message: 'Wallet creada exitosamente',
                wallet: newWallet
            });
        }
        catch (error) {
            console.error('Error creando wallet:', error);
            if (error instanceof Error) {
                if (error.message.includes('ya tiene una wallet')) {
                    res.status(409).json({ error: error.message });
                    return;
                }
                if (error.message.includes('no existe o no está activa')) {
                    res.status(400).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    updateWalletBalance: async (req, res) => {
        try {
            const walletId = parseInt(req.params.id);
            const { amount, operation } = req.body;
            if (isNaN(walletId)) {
                res.status(400).json({ error: 'ID de wallet inválido' });
                return;
            }
            if (amount === undefined || !operation) {
                res.status(400).json({
                    error: 'Datos requeridos faltantes',
                    required: ['amount', 'operation']
                });
                return;
            }
            if (isNaN(parseFloat(amount))) {
                res.status(400).json({ error: 'El monto debe ser un número válido' });
                return;
            }
            if (!['add', 'subtract', 'set'].includes(operation)) {
                res.status(400).json({
                    error: 'Operación inválida',
                    validOperations: ['add', 'subtract', 'set']
                });
                return;
            }
            const updatedWallet = await walletService_1.walletService.updateWalletBalance(walletId, parseFloat(amount), operation);
            res.json({
                message: 'Balance actualizado exitosamente',
                wallet: updatedWallet
            });
        }
        catch (error) {
            console.error('Error actualizando balance:', error);
            if (error instanceof Error) {
                if (error.message.includes('no encontrada')) {
                    res.status(404).json({ error: error.message });
                    return;
                }
                if (error.message.includes('insuficiente') || error.message.includes('negativo')) {
                    res.status(400).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    transferBetweenWallets: async (req, res) => {
        try {
            const { fromWalletId, toWalletId, amount } = req.body;
            if (!fromWalletId || !toWalletId || amount === undefined) {
                res.status(400).json({
                    error: 'Datos requeridos faltantes',
                    required: ['fromWalletId', 'toWalletId', 'amount']
                });
                return;
            }
            if (isNaN(parseInt(fromWalletId)) || isNaN(parseInt(toWalletId)) || isNaN(parseFloat(amount))) {
                res.status(400).json({ error: 'Los datos deben ser números válidos' });
                return;
            }
            if (parseFloat(amount) <= 0) {
                res.status(400).json({ error: 'El monto debe ser mayor a 0' });
                return;
            }
            if (fromWalletId === toWalletId) {
                res.status(400).json({ error: 'No se puede transferir a la misma wallet' });
                return;
            }
            const result = await walletService_1.walletService.transferBetweenWallets(parseInt(fromWalletId), parseInt(toWalletId), parseFloat(amount));
            res.json({
                message: 'Transferencia realizada exitosamente',
                transfer: {
                    amount: parseFloat(amount),
                    fromWallet: result.fromWallet,
                    toWallet: result.toWallet
                }
            });
        }
        catch (error) {
            console.error('Error en transferencia:', error);
            if (error instanceof Error) {
                if (error.message.includes('no existen') || error.message.includes('no encontrada')) {
                    res.status(404).json({ error: error.message });
                    return;
                }
                if (error.message.includes('insuficiente') || error.message.includes('misma criptomoneda')) {
                    res.status(400).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getUserTotalBalance: async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: 'ID de usuario inválido' });
                return;
            }
            const walletsWithBalance = await walletService_1.walletService.getUserTotalBalance(userId);
            const totalBalance = walletsWithBalance.reduce((sum, wallet) => sum + wallet.balance, 0);
            res.json({
                message: 'Balance total obtenido exitosamente',
                userId,
                totalWallets: walletsWithBalance.length,
                wallets: walletsWithBalance,
                summary: {
                    walletsWithBalance: walletsWithBalance.length,
                    totalCryptoHoldings: totalBalance.toFixed(8)
                }
            });
        }
        catch (error) {
            console.error('Error obteniendo balance total:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    deleteWallet: async (req, res) => {
        try {
            const walletId = parseInt(req.params.id);
            if (isNaN(walletId)) {
                res.status(400).json({ error: 'ID de wallet inválido' });
                return;
            }
            const deleted = await walletService_1.walletService.deleteWallet(walletId);
            if (!deleted) {
                res.status(404).json({ error: 'Wallet no encontrada' });
                return;
            }
            res.json({
                message: 'Wallet eliminada exitosamente',
                walletId
            });
        }
        catch (error) {
            console.error('Error eliminando wallet:', error);
            if (error instanceof Error) {
                if (error.message.includes('balance positivo')) {
                    res.status(400).json({
                        error: error.message,
                        hint: 'Transfiere o retira todos los fondos antes de eliminar la wallet'
                    });
                    return;
                }
                if (error.message.includes('no encontrada')) {
                    res.status(404).json({ error: error.message });
                    return;
                }
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getBalanceByCrypto: async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            const cryptoId = parseInt(req.params.cryptoId);
            if (isNaN(userId) || isNaN(cryptoId)) {
                res.status(400).json({ error: 'IDs inválidos' });
                return;
            }
            const balance = await walletService_1.walletService.getBalanceByCrypto(userId, cryptoId);
            if (balance === null) {
                res.status(404).json({
                    error: 'No se encontró balance para esta criptomoneda',
                    message: 'El usuario no tiene una wallet para esta criptomoneda'
                });
                return;
            }
            res.json({
                message: 'Balance obtenido exitosamente',
                balance
            });
        }
        catch (error) {
            console.error('Error obteniendo balance por criptomoneda:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
//# sourceMappingURL=walletController.js.map