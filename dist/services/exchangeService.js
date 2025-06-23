"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeService = void 0;
const databaseService_1 = require("./databaseService");
const cryptoAPIService_1 = require("./cryptoAPIService");
class ExchangeService {
    static async createExchange(exchangeData) {
        return await databaseService_1.db.transaction(async (connection) => {
            try {
                const [fromUser, toUser] = await Promise.all([
                    this.validateUser(exchangeData.fromUserId),
                    this.validateUser(exchangeData.toUserId)
                ]);
                if (!fromUser || !toUser) {
                    throw new Error('Uno o ambos usuarios no existen');
                }
                const [fromCrypto, toCrypto] = await Promise.all([
                    this.validateCryptocurrency(exchangeData.fromCurrencyId),
                    this.validateCryptocurrency(exchangeData.toCurrencyId)
                ]);
                if (!fromCrypto || !toCrypto) {
                    throw new Error('Una o ambas criptomonedas no existen o no están activas');
                }
                const hasBalance = await this.validateUserBalance(exchangeData.fromUserId, exchangeData.fromCurrencyId, exchangeData.fromAmount);
                if (!hasBalance) {
                    throw new Error('Balance insuficiente para realizar el intercambio');
                }
                const exchangeRate = await cryptoAPIService_1.CryptoApiService.getExchangeRate(fromCrypto.symbol, toCrypto.symbol);
                const toAmount = cryptoAPIService_1.CryptoApiService.calculateExchangeAmount(exchangeData.fromAmount, exchangeRate.rate);
                const insertQuery = `
          INSERT INTO EXCHANGE (
            from_user_id, to_user_id, from_currency_id, to_currency_id,
            from_amount, to_amount, exchange_api_rate, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `;
                const params = [
                    exchangeData.fromUserId,
                    exchangeData.toUserId,
                    exchangeData.fromCurrencyId,
                    exchangeData.toCurrencyId,
                    exchangeData.fromAmount,
                    toAmount,
                    exchangeRate.rate
                ];
                const [result] = await connection.execute(insertQuery, params);
                const exchangeId = result.insertId;
                return await this.getExchangeById(exchangeId);
            }
            catch (error) {
                console.error('Error creando intercambio:', error);
                throw error;
            }
        });
    }
    static async processExchange(exchangeId) {
        return await databaseService_1.db.transaction(async (connection) => {
            try {
                const exchange = await this.getExchangeById(exchangeId);
                if (!exchange) {
                    throw new Error('Intercambio no encontrado');
                }
                if (exchange.status !== 'pending') {
                    throw new Error('El intercambio ya ha sido procesado');
                }
                const hasBalance = await this.validateUserBalance(exchange.from_user_id, exchange.from_currency_id, exchange.from_amount);
                if (!hasBalance) {
                    throw new Error('Balance insuficiente para procesar el intercambio');
                }
                await this.updateWalletBalance(connection, exchange.from_user_id, exchange.from_currency_id, -exchange.from_amount);
                await this.updateWalletBalance(connection, exchange.to_user_id, exchange.to_currency_id, exchange.to_amount);
                const updateQuery = `
          UPDATE EXCHANGE 
          SET status = 'completed' 
          WHERE id = ?
        `;
                await connection.execute(updateQuery, [exchangeId]);
                return await this.getExchangeById(exchangeId);
            }
            catch (error) {
                console.error('Error procesando intercambio:', error);
                await this.markExchangeAsFailed(exchangeId);
                throw error;
            }
        });
    }
    static async getExchangeById(exchangeId) {
        try {
            const query = `
        SELECT * FROM EXCHANGE 
        WHERE id = ?
      `;
            const [rows] = await databaseService_1.db.execute(query, [exchangeId]);
            if (!rows || rows.length === 0) {
                return null;
            }
            return this.mapRowToExchange(rows[0]);
        }
        catch (error) {
            console.error('Error obteniendo intercambio:', error);
            throw error;
        }
    }
    static async getUserExchanges(userId, limit = 50, offset = 0) {
        try {
            const query = `
        SELECT 
          e.*,
          u1.username as fromUserUsername,
          u2.username as toUserUsername,
          c1.symbol as fromCurrencySymbol,
          c1.name as fromCurrencyName,
          c2.symbol as toCurrencySymbol,
          c2.name as toCurrencyName
        FROM EXCHANGE e
        JOIN USER u1 ON e.from_user_id = u1.id
        JOIN USER u2 ON e.to_user_id = u2.id
        JOIN CRYPTOCURRENCIES c1 ON e.from_currency_id = c1.id
        JOIN CRYPTOCURRENCIES c2 ON e.to_currency_id = c2.id
        WHERE e.from_user_id = ? OR e.to_user_id = ?
        ORDER BY e.id DESC
        LIMIT ? OFFSET ?
      `;
            const [rows] = await databaseService_1.db.execute(query, [userId, userId, limit, offset]);
            return rows.map((row) => this.mapRowToExchangeWithDetails(row));
        }
        catch (error) {
            console.error('Error obteniendo intercambios del usuario:', error);
            throw error;
        }
    }
    static async getExchangesByStatus(status, limit = 50, offset = 0) {
        try {
            const query = `
        SELECT 
          e.*,
          u1.username as fromUserUsername,
          u2.username as toUserUsername,
          c1.symbol as fromCurrencySymbol,
          c1.name as fromCurrencyName,
          c2.symbol as toCurrencySymbol,
          c2.name as toCurrencyName
        FROM EXCHANGE e
        JOIN USER u1 ON e.from_user_id = u1.id
        JOIN USER u2 ON e.to_user_id = u2.id
        JOIN CRYPTOCURRENCIES c1 ON e.from_currency_id = c1.id
        JOIN CRYPTOCURRENCIES c2 ON e.to_currency_id = c2.id
        WHERE e.status = ?
        ORDER BY e.id DESC
        LIMIT ? OFFSET ?
      `;
            const [rows] = await databaseService_1.db.execute(query, [status, limit, offset]);
            return rows.map((row) => this.mapRowToExchangeWithDetails(row));
        }
        catch (error) {
            console.error('Error obteniendo intercambios por estado:', error);
            throw error;
        }
    }
    static async cancelExchange(exchangeId, userId) {
        return await databaseService_1.db.transaction(async (connection) => {
            try {
                const exchange = await this.getExchangeById(exchangeId);
                if (!exchange) {
                    throw new Error('Intercambio no encontrado');
                }
                if (exchange.from_user_id !== userId && exchange.to_user_id !== userId) {
                    throw new Error('No tienes permisos para cancelar este intercambio');
                }
                if (exchange.status !== 'pending') {
                    throw new Error('Solo se pueden cancelar intercambios pendientes');
                }
                const updateQuery = `
          UPDATE EXCHANGE 
          SET status = 'failed' 
          WHERE id = ?
        `;
                await connection.execute(updateQuery, [exchangeId]);
                return await this.getExchangeById(exchangeId);
            }
            catch (error) {
                console.error('Error cancelando intercambio:', error);
                throw error;
            }
        });
    }
    static async getUserExchangeStats(userId) {
        try {
            const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN from_user_id = ? AND status = 'completed' THEN from_amount ELSE 0 END) as totalSent,
          SUM(CASE WHEN to_user_id = ? AND status = 'completed' THEN to_amount ELSE 0 END) as totalReceived
        FROM EXCHANGE 
        WHERE from_user_id = ? OR to_user_id = ?
      `;
            const [rows] = await databaseService_1.db.execute(query, [userId, userId, userId, userId]);
            return rows[0] || {
                total: 0,
                completed: 0,
                pending: 0,
                failed: 0,
                totalSent: 0,
                totalReceived: 0
            };
        }
        catch (error) {
            console.error('Error obteniendo estadísticas de intercambios:', error);
            throw error;
        }
    }
    static async validateUser(userId) {
        try {
            const query = 'SELECT id FROM USER WHERE id = ?';
            const [rows] = await databaseService_1.db.execute(query, [userId]);
            return rows && rows.length > 0;
        }
        catch (error) {
            console.error('Error validando usuario:', error);
            return false;
        }
    }
    static async validateCryptocurrency(cryptoId) {
        try {
            const query = 'SELECT * FROM CRYPTOCURRENCIES WHERE id = ? AND is_active = TRUE';
            const [rows] = await databaseService_1.db.execute(query, [cryptoId]);
            return rows && rows.length > 0 ? rows[0] : null;
        }
        catch (error) {
            console.error('Error validando criptomoneda:', error);
            return null;
        }
    }
    static async validateUserBalance(userId, cryptoId, amount) {
        try {
            const query = `
        SELECT balance FROM WALLET 
        WHERE user_id = ? AND cryptocurrency_id = ?
      `;
            const [rows] = await databaseService_1.db.execute(query, [userId, cryptoId]);
            if (!rows || rows.length === 0) {
                return false;
            }
            const currentBalance = parseFloat(rows[0].balance);
            return currentBalance >= amount;
        }
        catch (error) {
            console.error('Error validando balance:', error);
            return false;
        }
    }
    static async updateWalletBalance(connection, userId, cryptoId, amount) {
        try {
            const checkQuery = `
        SELECT id, balance FROM WALLET 
        WHERE user_id = ? AND cryptocurrency_id = ?
      `;
            const [walletRows] = await connection.execute(checkQuery, [userId, cryptoId]);
            if (!walletRows || walletRows.length === 0) {
                if (amount > 0) {
                    const insertQuery = `
            INSERT INTO WALLET (user_id, cryptocurrency_id, balance) 
            VALUES (?, ?, ?)
          `;
                    await connection.execute(insertQuery, [userId, cryptoId, amount]);
                }
                else {
                    throw new Error('No se puede debitar de una wallet que no existe');
                }
            }
            else {
                const updateQuery = `
          UPDATE WALLET 
          SET balance = balance + ? 
          WHERE user_id = ? AND cryptocurrency_id = ?
        `;
                await connection.execute(updateQuery, [amount, userId, cryptoId]);
            }
        }
        catch (error) {
            console.error('Error actualizando balance de wallet:', error);
            throw error;
        }
    }
    static async markExchangeAsFailed(exchangeId) {
        try {
            const query = `
        UPDATE EXCHANGE 
        SET status = 'failed' 
        WHERE id = ?
      `;
            await databaseService_1.db.execute(query, [exchangeId]);
        }
        catch (error) {
            console.error('Error marcando intercambio como fallido:', error);
        }
    }
    static mapRowToExchange(row) {
        return {
            id: row.id,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
            from_currency_id: row.from_currency_id,
            to_currency_id: row.to_currency_id,
            from_amount: parseFloat(row.from_amount),
            to_amount: parseFloat(row.to_amount),
            exchange_api_rate: parseFloat(row.exchange_api_rate),
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
    static mapRowToExchangeWithDetails(row) {
        return {
            ...this.mapRowToExchange(row),
            fromUserUsername: row.fromUserUsername,
            toUserUsername: row.toUserUsername,
            fromCurrencySymbol: row.fromCurrencySymbol,
            toCurrencySymbol: row.toCurrencySymbol,
            fromCurrencyName: row.fromCurrencyName,
            toCurrencyName: row.toCurrencyName
        };
    }
    static async getUserSentExchanges(userId, limit = 50, offset = 0) {
        try {
            const query = `
      SELECT 
        e.*,
        u1.username as fromUserUsername,
        u2.username as toUserUsername,
        c1.symbol as fromCurrencySymbol,
        c1.name as fromCurrencyName,
        c2.symbol as toCurrencySymbol,
        c2.name as toCurrencyName
      FROM EXCHANGE e
      JOIN USER u1 ON e.from_user_id = u1.id
      JOIN USER u2 ON e.to_user_id = u2.id
      JOIN CRYPTOCURRENCIES c1 ON e.from_currency_id = c1.id
      JOIN CRYPTOCURRENCIES c2 ON e.to_currency_id = c2.id
      WHERE e.from_user_id = ?
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `;
            const [rows] = await databaseService_1.db.execute(query, [userId, limit, offset]);
            return rows.map((row) => this.mapRowToExchangeWithDetails(row));
        }
        catch (error) {
            console.error('Error obteniendo intercambios enviados:', error);
            throw error;
        }
    }
    static async getUserReceivedExchanges(userId, limit = 50, offset = 0) {
        try {
            const query = `
      SELECT 
        e.*,
        u1.username as fromUserUsername,
        u2.username as toUserUsername,
        c1.symbol as fromCurrencySymbol,
        c1.name as fromCurrencyName,
        c2.symbol as toCurrencySymbol,
        c2.name as toCurrencyName
      FROM EXCHANGE e
      JOIN USER u1 ON e.from_user_id = u1.id
      JOIN USER u2 ON e.to_user_id = u2.id
      JOIN CRYPTOCURRENCIES c1 ON e.from_currency_id = c1.id
      JOIN CRYPTOCURRENCIES c2 ON e.to_currency_id = c2.id
      WHERE e.to_user_id = ?
      ORDER BY e.id DESC
      LIMIT ? OFFSET ?
    `;
            const [rows] = await databaseService_1.db.execute(query, [userId, limit, offset]);
            return rows.map((row) => this.mapRowToExchangeWithDetails(row));
        }
        catch (error) {
            console.error('Error obteniendo intercambios recibidos:', error);
            throw error;
        }
    }
}
exports.ExchangeService = ExchangeService;
//# sourceMappingURL=exchangeService.js.map