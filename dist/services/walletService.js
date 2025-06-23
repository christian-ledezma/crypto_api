"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
const databaseService_1 = require("./databaseService");
exports.walletService = {
    getUserWallets: async (userId) => {
        try {
            const query = `
        SELECT 
          w.id,
          w.user_id,
          w.cryptocurrency_id,
          w.balance,
          w.created_at,
          w.updated_at,
          c.symbol,
          c.name
        FROM WALLET w
        JOIN CRYPTOCURRENCIES c ON w.cryptocurrency_id = c.id
        WHERE w.user_id = ? AND c.is_active = TRUE
        ORDER BY c.name ASC
      `;
            const rows = await (0, databaseService_1.execute)(query, [userId]);
            return rows.map(row => exports.walletService.mapRowToWalletWithCrypto(row));
        }
        catch (error) {
            console.error('Error al obtener wallets del usuario:', error);
            throw new Error('Error al obtener las wallets del usuario');
        }
    },
    getWallet: async (walletId) => {
        try {
            const query = `
        SELECT 
          w.id,
          w.user_id,
          w.cryptocurrency_id,
          w.balance,
          w.created_at,
          w.updated_at,
          c.symbol,
          c.name
        FROM WALLET w
        JOIN CRYPTOCURRENCIES c ON w.cryptocurrency_id = c.id
        WHERE w.id = ?
      `;
            const rows = await (0, databaseService_1.execute)(query, [walletId]);
            return rows.length > 0 ? exports.walletService.mapRowToWalletWithCrypto(rows[0]) : null;
        }
        catch (error) {
            console.error('Error al obtener wallet:', error);
            throw new Error('Error al obtener la wallet');
        }
    },
    getUserWalletForCrypto: async (userId, cryptocurrencyId) => {
        try {
            const query = `
        SELECT 
          w.id,
          w.user_id,
          w.cryptocurrency_id,
          w.balance,
          w.created_at,
          w.updated_at,
          c.symbol,
          c.name
        FROM WALLET w
        JOIN CRYPTOCURRENCIES c ON w.cryptocurrency_id = c.id
        WHERE w.user_id = ? AND w.cryptocurrency_id = ?
      `;
            const rows = await (0, databaseService_1.execute)(query, [userId, cryptocurrencyId]);
            return rows.length > 0 ? exports.walletService.mapRowToWalletWithCrypto(rows[0]) : null;
        }
        catch (error) {
            console.error('Error al obtener wallet por criptomoneda:', error);
            throw new Error('Error al obtener wallet para la criptomoneda especificada');
        }
    },
    createWallet: async (userId, cryptocurrencyId) => {
        try {
            const existingWallet = await exports.walletService.getUserWalletForCrypto(userId, cryptocurrencyId);
            if (existingWallet) {
                throw new Error('El usuario ya tiene una wallet para esta criptomoneda');
            }
            const cryptoQuery = `
        SELECT id FROM CRYPTOCURRENCIES 
        WHERE id = ? AND is_active = TRUE
      `;
            const cryptoRows = await (0, databaseService_1.execute)(cryptoQuery, [cryptocurrencyId]);
            if (cryptoRows.length === 0) {
                throw new Error('La criptomoneda no existe o no está activa');
            }
            const insertQuery = `
        INSERT INTO WALLET (user_id, cryptocurrency_id, balance)
        VALUES (?, ?, 0.00000000)
      `;
            const result = await (0, databaseService_1.execute)(insertQuery, [userId, cryptocurrencyId]);
            const newWallet = await exports.walletService.getWallet(result.insertId);
            if (!newWallet) {
                throw new Error('Error al obtener la wallet creada');
            }
            return newWallet;
        }
        catch (error) {
            console.error('Error al crear wallet:', error);
            throw error;
        }
    },
    updateWalletBalance: async (walletId, amount, operation) => {
        try {
            return await (0, databaseService_1.transaction)(async (connection) => {
                const lockQuery = `
          SELECT balance FROM WALLET 
          WHERE id = ? 
          FOR UPDATE
        `;
                const [lockRows] = await connection.execute(lockQuery, [walletId]);
                const lockResult = lockRows;
                if (lockResult.length === 0) {
                    throw new Error('Wallet no encontrada');
                }
                const currentBalance = parseFloat(lockResult[0].balance);
                let newBalance;
                switch (operation) {
                    case 'add':
                        newBalance = currentBalance + amount;
                        break;
                    case 'subtract':
                        newBalance = currentBalance - amount;
                        if (newBalance < 0) {
                            throw new Error('Balance insuficiente');
                        }
                        break;
                    case 'set':
                        newBalance = amount;
                        if (newBalance < 0) {
                            throw new Error('El balance no puede ser negativo');
                        }
                        break;
                    default:
                        throw new Error('Operación no válida');
                }
                const updateQuery = `
          UPDATE WALLET 
          SET balance = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
                await connection.execute(updateQuery, [newBalance.toFixed(8), walletId]);
                const updatedWallet = await exports.walletService.getWallet(walletId);
                if (!updatedWallet) {
                    throw new Error('Error al obtener wallet actualizada');
                }
                return updatedWallet;
            });
        }
        catch (error) {
            console.error('Error al actualizar balance:', error);
            throw error;
        }
    },
    transferBetweenWallets: async (fromWalletId, toWalletId, amount) => {
        try {
            return await (0, databaseService_1.transaction)(async (connection) => {
                const walletsQuery = `
          SELECT id, balance, cryptocurrency_id 
          FROM WALLET 
          WHERE id IN (?, ?) 
          FOR UPDATE
        `;
                const [walletsRows] = await connection.execute(walletsQuery, [fromWalletId, toWalletId]);
                const wallets = walletsRows;
                if (wallets.length !== 2) {
                    throw new Error('Una o ambas wallets no existen');
                }
                const fromWallet = wallets.find(w => w.id === fromWalletId);
                const toWallet = wallets.find(w => w.id === toWalletId);
                if (!fromWallet || !toWallet) {
                    throw new Error('Error al obtener información de las wallets');
                }
                if (fromWallet.cryptocurrency_id !== toWallet.cryptocurrency_id) {
                    throw new Error('Las wallets deben ser de la misma criptomoneda');
                }
                const fromBalance = parseFloat(fromWallet.balance);
                const toBalance = parseFloat(toWallet.balance);
                if (fromBalance < amount) {
                    throw new Error('Balance insuficiente en la wallet de origen');
                }
                const updateQuery = `
          UPDATE WALLET 
          SET balance = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
                await connection.execute(updateQuery, [(fromBalance - amount).toFixed(8), fromWalletId]);
                await connection.execute(updateQuery, [(toBalance + amount).toFixed(8), toWalletId]);
                const updatedFromWallet = await exports.walletService.getWallet(fromWalletId);
                const updatedToWallet = await exports.walletService.getWallet(toWalletId);
                if (!updatedFromWallet || !updatedToWallet) {
                    throw new Error('Error al obtener wallets actualizadas');
                }
                return {
                    fromWallet: updatedFromWallet,
                    toWallet: updatedToWallet
                };
            });
        }
        catch (error) {
            console.error('Error en transferencia entre wallets:', error);
            throw error;
        }
    },
    getUserTotalBalance: async (userId) => {
        try {
            const wallets = await exports.walletService.getUserWallets(userId);
            return wallets.filter(wallet => wallet.balance > 0);
        }
        catch (error) {
            console.error('Error al obtener balance total del usuario:', error);
            throw new Error('Error al obtener el balance total del usuario');
        }
    },
    deleteWallet: async (walletId) => {
        try {
            const wallet = await exports.walletService.getWallet(walletId);
            if (!wallet) {
                throw new Error('Wallet no encontrada');
            }
            if (wallet.balance > 0) {
                throw new Error('No se puede eliminar una wallet con balance positivo');
            }
            const deleteQuery = `DELETE FROM WALLET WHERE id = ?`;
            const result = await (0, databaseService_1.execute)(deleteQuery, [walletId]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error al eliminar wallet:', error);
            throw error;
        }
    },
    mapRowToWalletWithCrypto: (row) => {
        return {
            id: row.id,
            user_id: row.user_id,
            cryptocurrency_id: row.cryptocurrency_id,
            balance: parseFloat(row.balance),
            created_at: row.created_at || new Date(),
            updated_at: row.updated_at || new Date(),
            cryptoSymbol: row.symbol,
            cryptoName: row.name
        };
    },
    getBalanceByCrypto: async (userId, cryptoId) => {
        try {
            const wallet = await exports.walletService.getUserWalletForCrypto(userId, cryptoId);
            if (!wallet) {
                throw new Error('No se encontró la wallet para la criptomoneda especificada');
            }
            return wallet;
        }
        catch (error) {
            console.error('Error al obtener balance por criptomoneda:', error);
            throw error;
        }
    }
};
//# sourceMappingURL=walletService.js.map