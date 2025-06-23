import { execute, transaction } from './databaseService';
import { Wallet } from '../models/Wallet';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Interfaz para los resultados de la base de datos con JOIN
interface WalletRowWithCrypto extends RowDataPacket {
  id: number;
  user_id: number;
  cryptocurrency_id: number;
  balance: string;
  created_at?: Date;
  updated_at?: Date;
  symbol: string;
  name: string;
}

// Interfaz extendida de Wallet que incluye información de la criptomoneda
export interface WalletWithCrypto extends Wallet {
  cryptoSymbol: string;
  cryptoName: string;
}

export const walletService = {
  // Obtener todas las wallets de un usuario
  getUserWallets: async (userId: number): Promise<WalletWithCrypto[]> => {
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
      
      const rows = await execute(query, [userId]) as WalletRowWithCrypto[];
      
      return rows.map(row => walletService.mapRowToWalletWithCrypto(row));
    } catch (error) {
      console.error('Error al obtener wallets del usuario:', error);
      throw new Error('Error al obtener las wallets del usuario');
    }
  },

  // Obtener una wallet específica
  getWallet: async (walletId: number): Promise<WalletWithCrypto | null> => {
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
      
      const rows = await execute(query, [walletId]) as WalletRowWithCrypto[];
      
      return rows.length > 0 ? walletService.mapRowToWalletWithCrypto(rows[0]) : null;
    } catch (error) {
      console.error('Error al obtener wallet:', error);
      throw new Error('Error al obtener la wallet');
    }
  },

  //getBalanceByCrypto
  getBalanceByCrypto: async (userId: number, cryptoId: number): Promise<WalletWithCrypto | null> => {
      try {
      const wallet = await walletService.getUserWalletForCrypto(userId, cryptoId);
      if (!wallet) {
          throw new Error('No se encontró la wallet para la criptomoneda especificada');
      }
      return wallet;
      } catch (error) {
      console.error('Error al obtener balance por criptomoneda:', error);
      throw error;
      }
  },

  // Obtener wallet de un usuario para una criptomoneda específica
  getUserWalletForCrypto: async (
    userId: number,
    cryptocurrencyId: number
  ): Promise<WalletWithCrypto | null> => {
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
      
      const rows = await execute(query, [userId, cryptocurrencyId]) as WalletRowWithCrypto[];
      
      return rows.length > 0 ? walletService.mapRowToWalletWithCrypto(rows[0]) : null;
    } catch (error) {
      console.error('Error al obtener wallet por criptomoneda:', error);
      throw new Error('Error al obtener wallet para la criptomoneda especificada');
    }
  },

  // Crear una nueva wallet
  createWallet: async (userId: number, cryptocurrencyId: number): Promise<WalletWithCrypto> => {
    try {
      // Verificar si el usuario ya tiene wallet para esta cripto
      const existingWallet = await walletService.getUserWalletForCrypto(userId, cryptocurrencyId);
      if (existingWallet) {
        throw new Error('El usuario ya tiene una wallet para esta criptomoneda');
      }

      // Verificar que la criptomoneda existe y está activa
      const cryptoQuery = `
        SELECT id FROM CRYPTOCURRENCIES 
        WHERE id = ? AND is_active = TRUE
      `;
      const cryptoRows = await execute(cryptoQuery, [cryptocurrencyId]) as RowDataPacket[];
      
      if (cryptoRows.length === 0) {
        throw new Error('La criptomoneda no existe o no está activa');
      }

      const insertQuery = `
        INSERT INTO WALLET (user_id, cryptocurrency_id, balance)
        VALUES (?, ?, 0.00000000)
      `;
      
      const result = await execute(insertQuery, [userId, cryptocurrencyId]) as ResultSetHeader;
      
      const newWallet = await walletService.getWallet(result.insertId);
      if (!newWallet) {
        throw new Error('Error al obtener la wallet creada');
      }
      
      return newWallet;
    } catch (error) {
      console.error('Error al crear wallet:', error);
      throw error; // Re-lanzar el error para mantener el mensaje específico
    }
  },

  // Actualizar balance de una wallet
  updateWalletBalance: async (
    walletId: number,
    amount: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<WalletWithCrypto> => {
    try {
      return await transaction(async (connection) => {
        // Obtener wallet actual con bloqueo
        const lockQuery = `
          SELECT balance FROM WALLET 
          WHERE id = ? 
          FOR UPDATE
        `;
        const [lockRows] = await connection.execute(lockQuery, [walletId]);
        const lockResult = lockRows as Array<{ balance: string }>;
        
        if (lockResult.length === 0) {
          throw new Error('Wallet no encontrada');
        }

        const currentBalance = parseFloat(lockResult[0].balance);
        let newBalance: number;

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

        // Actualizar balance
        const updateQuery = `
          UPDATE WALLET 
          SET balance = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        await connection.execute(updateQuery, [newBalance.toFixed(8), walletId]);

        // Obtener y retornar wallet actualizada
        const updatedWallet = await walletService.getWallet(walletId);
        if (!updatedWallet) {
          throw new Error('Error al obtener wallet actualizada');
        }
        
        return updatedWallet;
      });
    } catch (error) {
      console.error('Error al actualizar balance:', error);
      throw error;
    }
  },

  // Transferir entre wallets
  transferBetweenWallets: async (
    fromWalletId: number,
    toWalletId: number,
    amount: number
  ): Promise<{ fromWallet: WalletWithCrypto; toWallet: WalletWithCrypto }> => {
    try {
      return await transaction(async (connection) => {
        // Verificar que ambas wallets existen
        const walletsQuery = `
          SELECT id, balance, cryptocurrency_id 
          FROM WALLET 
          WHERE id IN (?, ?) 
          FOR UPDATE
        `;
        const [walletsRows] = await connection.execute(walletsQuery, [fromWalletId, toWalletId]);
        const wallets = walletsRows as Array<{ id: number; balance: string; cryptocurrency_id: number }>;
        
        if (wallets.length !== 2) {
          throw new Error('Una o ambas wallets no existen');
        }

        const fromWallet = wallets.find(w => w.id === fromWalletId);
        const toWallet = wallets.find(w => w.id === toWalletId);

        if (!fromWallet || !toWallet) {
          throw new Error('Error al obtener información de las wallets');
        }

        // Verificar que son de la misma criptomoneda
        if (fromWallet.cryptocurrency_id !== toWallet.cryptocurrency_id) {
          throw new Error('Las wallets deben ser de la misma criptomoneda');
        }

        const fromBalance = parseFloat(fromWallet.balance);
        const toBalance = parseFloat(toWallet.balance);

        if (fromBalance < amount) {
          throw new Error('Balance insuficiente en la wallet de origen');
        }

        // Actualizar balances
        const updateQuery = `
          UPDATE WALLET 
          SET balance = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        
        await connection.execute(updateQuery, [(fromBalance - amount).toFixed(8), fromWalletId]);
        await connection.execute(updateQuery, [(toBalance + amount).toFixed(8), toWalletId]);

        // Obtener wallets actualizadas
        const updatedFromWallet = await walletService.getWallet(fromWalletId);
        const updatedToWallet = await walletService.getWallet(toWalletId);

        if (!updatedFromWallet || !updatedToWallet) {
          throw new Error('Error al obtener wallets actualizadas');
        }

        return {
          fromWallet: updatedFromWallet,
          toWallet: updatedToWallet
        };
      });
    } catch (error) {
      console.error('Error en transferencia entre wallets:', error);
      throw error;
    }
  },

  // Eliminar wallet (solo si balance es 0)
  deleteWallet: async (walletId: number): Promise<boolean> => {
    try {
      const wallet = await walletService.getWallet(walletId);
      
      if (!wallet) {
        throw new Error('Wallet no encontrada');
      }

      if (wallet.balance > 0) {
        throw new Error('No se puede eliminar una wallet con balance positivo');
      }

      const deleteQuery = `DELETE FROM WALLET WHERE id = ?`;
      const result = await execute(deleteQuery, [walletId]) as ResultSetHeader;
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar wallet:', error);
      throw error;
    }
  },

  // Mapear fila de DB a objeto WalletWithCrypto
  mapRowToWalletWithCrypto: (row: WalletRowWithCrypto): WalletWithCrypto => {
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

};