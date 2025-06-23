import { db } from './databaseService';
import { CryptoApiService } from './cryptoAPIService';
import { Exchange } from '../models/Exchange';
import mysql from 'mysql2/promise';

export type ExchangeStatus = 'pending' | 'completed' | 'failed';

interface CreateExchangeData {
  fromUserId: number;
  toUserId: number;
  fromCurrencyId: number;
  toCurrencyId: number;
  fromAmount: number;
}

interface ExchangeWithDetails extends Exchange {
  fromUserUsername: string;
  toUserUsername: string;
  fromCurrencySymbol: string;
  toCurrencySymbol: string;
  fromCurrencyName: string;
  toCurrencyName: string;
}

export class ExchangeService {
   // Obtener intercambios de un usuario
  static async getUserExchanges(userId: number, limit: number = 50, offset: number = 0): Promise<ExchangeWithDetails[]> {
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

      const [rows]: any = await db.execute(query, [userId, userId, limit, offset]);
      
      return rows.map((row: any) => this.mapRowToExchangeWithDetails(row));
    } catch (error) {
      console.error('Error obteniendo intercambios del usuario:', error);
      throw error;
    }
  }

   // Obtener intercambio por ID
  static async getExchangeById(exchangeId: number): Promise<Exchange | null> {
    try {
      const query = `
        SELECT * FROM EXCHANGE 
        WHERE id = ?
      `;
      
      const [rows]: any = await db.execute(query, [exchangeId]);
      
      if (!rows || rows.length === 0) {
        return null;
      }

      return this.mapRowToExchange(rows[0]);
    } catch (error) {
      console.error('Error obteniendo intercambio:', error);
      throw error;
    }
  }

  // Crear un nuevo intercambio
  static async createExchange(exchangeData: CreateExchangeData): Promise<Exchange> {
    return await db.transaction(async (connection) => {
      try {
        // 1. Validar que los usuarios existan
        const [fromUser, toUser] = await Promise.all([
          this.validateUser(exchangeData.fromUserId),
          this.validateUser(exchangeData.toUserId)
        ]);

        if (!fromUser || !toUser) {
          throw new Error('Uno o ambos usuarios no existen');
        }

        // 2. Validar que las criptomonedas existan y estén activas
        const [fromCrypto, toCrypto] = await Promise.all([
          this.validateCryptocurrency(exchangeData.fromCurrencyId),
          this.validateCryptocurrency(exchangeData.toCurrencyId)
        ]);

        if (!fromCrypto || !toCrypto) {
          throw new Error('Una o ambas criptomonedas no existen o no están activas');
        }

        // 3. Validar que el usuario origen tenga suficiente balance
        const hasBalance = await this.validateUserBalance(
          exchangeData.fromUserId,
          exchangeData.fromCurrencyId,
          exchangeData.fromAmount
        );

        if (!hasBalance) {
          throw new Error('Balance insuficiente para realizar el intercambio');
        }

        // 4. Obtener tasa de cambio actual de la API
        const exchangeRate = await CryptoApiService.getExchangeRate(
          fromCrypto.symbol,
          toCrypto.symbol
        );

        // 5. Calcular cantidad de destino
        const toAmount = CryptoApiService.calculateExchangeAmount(
          exchangeData.fromAmount,
          exchangeRate.rate
        );

        // 6. Crear el registro de intercambio
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

        const [result]: any = await connection.execute(insertQuery, params);
        const exchangeId = result.insertId;

        // 7. Retornar el intercambio creado
        return await this.getExchangeById(exchangeId);
      } catch (error) {
        console.error('Error creando intercambio:', error);
        throw error;
      }
    });
  }

  // Procesar un intercambio (cambiar balances)
  static async processExchange(exchangeId: number): Promise<Exchange> {
    return await db.transaction(async (connection) => {
      try {
        // 1. Obtener detalles del intercambio
        const exchange = await this.getExchangeById(exchangeId);
        
        if (!exchange) {
          throw new Error('Intercambio no encontrado');
        }

        if (exchange.status !== 'pending') {
          throw new Error('El intercambio ya ha sido procesado');
        }

        // 2. Validar nuevamente el balance del usuario origen
        const hasBalance = await this.validateUserBalance(
          exchange.from_user_id,
          exchange.from_currency_id,
          exchange.from_amount
        );

        if (!hasBalance) {
          throw new Error('Balance insuficiente para procesar el intercambio');
        }

        // 3. Actualizar balance del usuario origen (restar)
        await this.updateWalletBalance(
          connection,
          exchange.from_user_id,
          exchange.from_currency_id,
          -exchange.from_amount
        );

        // 4. Actualizar balance del usuario destino (sumar)
        await this.updateWalletBalance(
          connection,
          exchange.to_user_id,
          exchange.to_currency_id,
          exchange.to_amount
        );

        // 5. Marcar intercambio como completado
        const updateQuery = `
          UPDATE EXCHANGE 
          SET status = 'completed' 
          WHERE id = ?
        `;
        
        await connection.execute(updateQuery, [exchangeId]);

        // 6. Retornar intercambio actualizado
        return await this.getExchangeById(exchangeId);
      } catch (error) {
        console.error('Error procesando intercambio:', error);
        // Marcar como fallido si hay error
        await this.markExchangeAsFailed(exchangeId);
        throw error;
      }
    });
  }

  // Obtener intercambios por estado
  static async getExchangesByStatus(status: ExchangeStatus, limit: number = 50, offset: number = 0): Promise<ExchangeWithDetails[]> {
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

      const [rows]: any = await db.execute(query, [status, limit, offset]);
      
      return rows.map((row: any) => this.mapRowToExchangeWithDetails(row));
    } catch (error) {
      console.error('Error obteniendo intercambios por estado:', error);
      throw error;
    }
  }

  // Cancelar un intercambio pendiente
  static async cancelExchange(exchangeId: number, userId: number): Promise<Exchange> {
    return await db.transaction(async (connection) => {
      try {
        // Verificar que el intercambio existe y pertenece al usuario
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

        // Marcar como fallido
        const updateQuery = `
          UPDATE EXCHANGE 
          SET status = 'failed' 
          WHERE id = ?
        `;
        
        await connection.execute(updateQuery, [exchangeId]);

        return await this.getExchangeById(exchangeId);
      } catch (error) {
        console.error('Error cancelando intercambio:', error);
        throw error;
      }
    });
  }

  // MÉTODOS AUXILIARES PRIVADOS

  // Validar que un usuario existe
  private static async validateUser(userId: number): Promise<boolean> {
    try {
      const query = 'SELECT id FROM USER WHERE id = ?';
      const [rows]: any = await db.execute(query, [userId]);
      return rows && rows.length > 0;
    } catch (error) {
      console.error('Error validando usuario:', error);
      return false;
    }
  }

  // Validar que una criptomoneda existe y está activa
  private static async validateCryptocurrency(cryptoId: number): Promise<any> {
    try {
      const query = 'SELECT * FROM CRYPTOCURRENCIES WHERE id = ? AND is_active = TRUE';
      const [rows]: any = await db.execute(query, [cryptoId]);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error validando criptomoneda:', error);
      return null;
    }
  }

  // Validar que un usuario tiene suficiente balance
  private static async validateUserBalance(userId: number, cryptoId: number, amount: number): Promise<boolean> {
    try {
      const query = `
        SELECT balance FROM WALLET 
        WHERE user_id = ? AND cryptocurrency_id = ?
      `;
      
      const [rows]: any = await db.execute(query, [userId, cryptoId]);
      
      if (!rows || rows.length === 0) {
        return false;
      }

      const currentBalance = parseFloat(rows[0].balance);
      return currentBalance >= amount;
    } catch (error) {
      console.error('Error validando balance:', error);
      return false;
    }
  }

  // Actualizar balance de wallet
  private static async updateWalletBalance(
    connection: mysql.PoolConnection, 
    userId: number, 
    cryptoId: number, 
    amount: number
  ): Promise<void> {
    try {
      // Verificar si existe la wallet
      const checkQuery = `
        SELECT id, balance FROM WALLET 
        WHERE user_id = ? AND cryptocurrency_id = ?
      `;
      
      const [walletRows]: any = await connection.execute(checkQuery, [userId, cryptoId]);
      
      if (!walletRows || walletRows.length === 0) {
        // Crear wallet si no existe (solo para sumas positivas)
        if (amount > 0) {
          const insertQuery = `
            INSERT INTO WALLET (user_id, cryptocurrency_id, balance) 
            VALUES (?, ?, ?)
          `;
          await connection.execute(insertQuery, [userId, cryptoId, amount]);
        } else {
          throw new Error('No se puede debitar de una wallet que no existe');
        }
      } else {
        // Actualizar balance existente
        const updateQuery = `
          UPDATE WALLET 
          SET balance = balance + ? 
          WHERE user_id = ? AND cryptocurrency_id = ?
        `;
        
        await connection.execute(updateQuery, [amount, userId, cryptoId]);
      }
    } catch (error) {
      console.error('Error actualizando balance de wallet:', error);
      throw error;
    }
  }

  // Marcar intercambio como fallido
  private static async markExchangeAsFailed(exchangeId: number): Promise<void> {
    try {
      const query = `
        UPDATE EXCHANGE 
        SET status = 'failed' 
        WHERE id = ?
      `;
      
      await db.execute(query, [exchangeId]);
    } catch (error) {
      console.error('Error marcando intercambio como fallido:', error);
    }
  }

  // Mapear fila de DB a objeto Exchange
  private static mapRowToExchange(row: any): Exchange {
    return {
      id: row.id,
      from_user_id: row.from_user_id,
      to_user_id: row.to_user_id,
      from_currency_id: row.from_currency_id,
      to_currency_id: row.to_currency_id,
      from_amount: parseFloat(row.from_amount),
      to_amount: parseFloat(row.to_amount),
      exchange_api_rate: parseFloat(row.exchange_api_rate),
      status: row.status as ExchangeStatus,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Mapear fila de DB a objeto ExchangeWithDetails
  private static mapRowToExchangeWithDetails(row: any): ExchangeWithDetails {
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

  static async getUserSentExchanges(userId: number, limit: number = 50, offset: number = 0): Promise<ExchangeWithDetails[]> {
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

    const [rows]: any = await db.execute(query, [userId, limit, offset]);
    
    return rows.map((row: any) => this.mapRowToExchangeWithDetails(row));
  } catch (error) {
    console.error('Error obteniendo intercambios enviados:', error);
    throw error;
  }
}

// Obtener intercambios recibidos por un usuario
static async getUserReceivedExchanges(userId: number, limit: number = 50, offset: number = 0): Promise<ExchangeWithDetails[]> {
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

    const [rows]: any = await db.execute(query, [userId, limit, offset]);
    
    return rows.map((row: any) => this.mapRowToExchangeWithDetails(row));
  } catch (error) {
    console.error('Error obteniendo intercambios recibidos:', error);
    throw error;
  }
}
}

