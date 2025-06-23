"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoService = void 0;
const databaseService_1 = require("./databaseService");
exports.cryptoService = {
    getAllCryptocurrencies: async () => {
        try {
            const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        ORDER BY name ASC
      `;
            const rows = await (0, databaseService_1.execute)(query);
            return rows.map(row => ({
                id: row.id,
                symbol: row.symbol,
                name: row.name,
                is_active: Boolean(row.is_active),
                created_at: row.created_at || new Date(),
                updated_at: row.updated_at || new Date()
            }));
        }
        catch (error) {
            console.error('Error en getAllCryptocurrencies:', error);
            throw new Error('Error al obtener todas las criptomonedas');
        }
    },
    getCurrentPrice: async (symbol) => {
        try {
            const query = `
        SELECT price 
        FROM CRYPTOCURRENCY_PRICES 
        WHERE UPPER(symbol) = UPPER(?)
        ORDER BY timestamp DESC
        LIMIT 1
      `;
            const rows = await (0, databaseService_1.execute)(query, [symbol]);
            if (rows.length === 0) {
                return null;
            }
            return rows[0].price;
        }
        catch (error) {
            console.error('Error en getCurrentPrice:', error);
            throw new Error('Error al obtener el precio actual');
        }
    },
    getActiveCryptocurrencies: async () => {
        try {
            const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        WHERE is_active = TRUE 
        ORDER BY name ASC
      `;
            const rows = await (0, databaseService_1.execute)(query);
            return rows.map(row => ({
                id: row.id,
                symbol: row.symbol,
                name: row.name,
                is_active: Boolean(row.is_active),
                created_at: row.created_at || new Date(),
                updated_at: row.updated_at || new Date()
            }));
        }
        catch (error) {
            console.error('Error en getActiveCryptocurrencies:', error);
            throw new Error('Error al obtener criptomonedas activas');
        }
    },
    getCryptocurrencyById: async (id) => {
        try {
            const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        WHERE id = ?
      `;
            const rows = await (0, databaseService_1.execute)(query, [id]);
            if (rows.length === 0) {
                return null;
            }
            const row = rows[0];
            return {
                id: row.id,
                symbol: row.symbol,
                name: row.name,
                is_active: Boolean(row.is_active),
                created_at: row.created_at || new Date(),
                updated_at: row.updated_at || new Date()
            };
        }
        catch (error) {
            console.error('Error en getCryptocurrencyById:', error);
            throw new Error('Error al obtener criptomoneda por ID');
        }
    },
    getCryptocurrencyBySymbol: async (symbol) => {
        try {
            const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        WHERE UPPER(symbol) = UPPER(?)
      `;
            const rows = await (0, databaseService_1.execute)(query, [symbol]);
            if (rows.length === 0) {
                return null;
            }
            const row = rows[0];
            return {
                id: row.id,
                symbol: row.symbol,
                name: row.name,
                is_active: Boolean(row.is_active),
                created_at: row.created_at || new Date(),
                updated_at: row.updated_at || new Date()
            };
        }
        catch (error) {
            console.error('Error en getCryptocurrencyBySymbol:', error);
            throw new Error('Error al obtener criptomoneda por símbolo');
        }
    },
    createCryptocurrency: async (cryptocurrencyData) => {
        try {
            const existingCrypto = await exports.cryptoService.getCryptocurrencyBySymbol(cryptocurrencyData.symbol);
            if (existingCrypto) {
                throw new Error('Ya existe una criptomoneda con ese símbolo');
            }
            const query = `
        INSERT INTO CRYPTOCURRENCIES (symbol, name, is_active) 
        VALUES (?, ?, ?)
      `;
            const params = [
                cryptocurrencyData.symbol.toUpperCase(),
                cryptocurrencyData.name,
                cryptocurrencyData.is_active ?? true
            ];
            const result = await (0, databaseService_1.execute)(query, params);
            const newCryptocurrency = await exports.cryptoService.getCryptocurrencyById(result.insertId);
            if (!newCryptocurrency) {
                throw new Error('Error al obtener la criptomoneda creada');
            }
            return newCryptocurrency;
        }
        catch (error) {
            console.error('Error en createCryptocurrency:', error);
            if (error instanceof Error) {
                if (error.message.includes('Ya existe una criptomoneda')) {
                    throw error;
                }
                if (error.message.includes('Duplicate entry')) {
                    throw new Error('Ya existe una criptomoneda con ese símbolo');
                }
            }
            throw new Error('Error al crear criptomoneda');
        }
    },
    updateCryptocurrency: async (id, updateData) => {
        try {
            const existingCrypto = await exports.cryptoService.getCryptocurrencyById(id);
            if (!existingCrypto) {
                return null;
            }
            if (updateData.symbol) {
                const cryptoWithSameSymbol = await exports.cryptoService.getCryptocurrencyBySymbol(updateData.symbol);
                if (cryptoWithSameSymbol && cryptoWithSameSymbol.id !== id) {
                    throw new Error('Ya existe una criptomoneda con ese símbolo');
                }
            }
            const updates = [];
            const params = [];
            if (updateData.symbol !== undefined) {
                updates.push('symbol = ?');
                params.push(updateData.symbol.toUpperCase());
            }
            if (updateData.name !== undefined) {
                updates.push('name = ?');
                params.push(updateData.name);
            }
            if (updateData.is_active !== undefined) {
                updates.push('is_active = ?');
                params.push(updateData.is_active);
            }
            if (updates.length === 0) {
                return existingCrypto;
            }
            const query = `
        UPDATE CRYPTOCURRENCIES 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;
            params.push(id);
            await (0, databaseService_1.execute)(query, params);
            return await exports.cryptoService.getCryptocurrencyById(id);
        }
        catch (error) {
            console.error('Error en updateCryptocurrency:', error);
            if (error instanceof Error) {
                if (error.message.includes('Ya existe una criptomoneda')) {
                    throw error;
                }
                if (error.message.includes('Duplicate entry')) {
                    throw new Error('Ya existe una criptomoneda con ese símbolo');
                }
            }
            throw new Error('Error al actualizar criptomoneda');
        }
    },
    deactivateCryptocurrency: async (id) => {
        try {
            const query = `
        UPDATE CRYPTOCURRENCIES 
        SET is_active = FALSE 
        WHERE id = ?
      `;
            const result = await (0, databaseService_1.execute)(query, [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error en deactivateCryptocurrency:', error);
            throw new Error('Error al desactivar criptomoneda');
        }
    },
    activateCryptocurrency: async (id) => {
        try {
            const query = `
        UPDATE CRYPTOCURRENCIES 
        SET is_active = TRUE 
        WHERE id = ?
      `;
            const result = await (0, databaseService_1.execute)(query, [id]);
            return result.affectedRows > 0;
        }
        catch (error) {
            console.error('Error en activateCryptocurrency:', error);
            throw new Error('Error al activar criptomoneda');
        }
    },
    isActiveCryptocurrency: async (id) => {
        try {
            const query = `
        SELECT COUNT(*) as count 
        FROM CRYPTOCURRENCIES 
        WHERE id = ? AND is_active = TRUE
      `;
            const rows = await (0, databaseService_1.execute)(query, [id]);
            return rows[0].count > 0;
        }
        catch (error) {
            console.error('Error en isActiveCryptocurrency:', error);
            throw new Error('Error al verificar si la criptomoneda está activa');
        }
    },
    getCryptocurrencyStats: async () => {
        try {
            const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
        FROM CRYPTOCURRENCIES
      `;
            const rows = await (0, databaseService_1.execute)(query);
            return {
                total: Number(rows[0].total),
                active: Number(rows[0].active),
                inactive: Number(rows[0].inactive)
            };
        }
        catch (error) {
            console.error('Error en getCryptocurrencyStats:', error);
            throw new Error('Error al obtener estadísticas de criptomonedas');
        }
    }
};
//# sourceMappingURL=cryptoService.js.map