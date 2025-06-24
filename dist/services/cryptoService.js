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