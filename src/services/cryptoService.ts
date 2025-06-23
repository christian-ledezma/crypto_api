import { execute} from './databaseService';
import { Cryptocurrency} from '../models/Cryptocurrency';
import { RowDataPacket } from 'mysql2';

// Interfaz para los resultados de la base de datos
interface CryptocurrencyRow extends RowDataPacket {
  id: number;
  symbol: string;
  name: string;
  is_active: boolean;
}

export const cryptoService = {
  // Obtener todas las criptomonedas
  getAllCryptocurrencies: async (): Promise<Cryptocurrency[]> => {
    try {
      const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        ORDER BY name ASC
      `;
      
      const rows = await execute(query) as CryptocurrencyRow[];
      
      return rows.map(row => ({
        id: row.id,
        symbol: row.symbol,
        name: row.name,
        is_active: Boolean(row.is_active),
        created_at: row.created_at || new Date(),
        updated_at: row.updated_at || new Date()
      }));
    } catch (error) {
      console.error('Error en getAllCryptocurrencies:', error);
      throw new Error('Error al obtener todas las criptomonedas');
    }
  },

  // Obtener criptomoneda por ID
  getCryptocurrencyById: async (id: number): Promise<Cryptocurrency | null> => {
    try {
      const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        WHERE id = ?
      `;
      
      const rows = await execute(query, [id]) as CryptocurrencyRow[];
      
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
    } catch (error) {
      console.error('Error en getCryptocurrencyById:', error);
      throw new Error('Error al obtener criptomoneda por ID');
    }
  },

  // obtener precio actual de una criptomoneda
  getCurrentPrice: async (symbol: string): Promise<number | null> => {
    try {
      const query = `
        SELECT price 
        FROM CRYPTOCURRENCY_PRICES 
        WHERE UPPER(symbol) = UPPER(?)
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      const rows = await execute(query, [symbol]) as { price: number }[];

      if (rows.length === 0) {
        return null;
      }

      return rows[0].price;
    } catch (error) {
      console.error('Error en getCurrentPrice:', error);
      throw new Error('Error al obtener el precio actual');
    }
  },

  // Obtener criptomoneda por símbolo
  getCryptocurrencyBySymbol: async (symbol: string): Promise<Cryptocurrency | null> => {
    try {
      const query = `
        SELECT id, symbol, name, is_active 
        FROM CRYPTOCURRENCIES 
        WHERE UPPER(symbol) = UPPER(?)
      `;
      
      const rows = await execute(query, [symbol]) as CryptocurrencyRow[];
      
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
    } catch (error) {
      console.error('Error en getCryptocurrencyBySymbol:', error);
      throw new Error('Error al obtener criptomoneda por símbolo');
    }
  },

  // Verificar si una criptomoneda existe y está activa
  isActiveCryptocurrency: async (id: number): Promise<boolean> => {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM CRYPTOCURRENCIES 
        WHERE id = ? AND is_active = TRUE
      `;
      
      const rows = await execute(query, [id]) as Array<{ count: number }>;
      
      return rows[0].count > 0;
    } catch (error) {
      console.error('Error en isActiveCryptocurrency:', error);
      throw new Error('Error al verificar si la criptomoneda está activa');
    }
  },

  // Obtener estadísticas de criptomonedas
  getCryptocurrencyStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive
        FROM CRYPTOCURRENCIES
      `;
      
      const rows = await execute(query) as Array<{
        total: number;
        active: number;
        inactive: number;
      }>;
      
      return {
        total: Number(rows[0].total),
        active: Number(rows[0].active),
        inactive: Number(rows[0].inactive)
      };
    } catch (error) {
      console.error('Error en getCryptocurrencyStats:', error);
      throw new Error('Error al obtener estadísticas de criptomonedas');
    }
  }
};