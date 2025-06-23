import { Request, Response } from 'express';
import { CryptoApiService } from '../services/cryptoAPIService';

export class HealthController {
  // Endpoint para verificar estado general de la API
  static async checkHealth(_req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await CryptoApiService.healthCheck();
      
      res.status(healthCheck.status === 'healthy' ? 200 : 503).json({
        success: healthCheck.status === 'healthy',
        data: healthCheck,
        message: healthCheck.status === 'healthy' 
          ? 'API funcionando correctamente' 
          : 'API con problemas'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error verificando estado de la API',
        error: error.message
      });
    }
  }

  // Endpoint para limpiar caché (útil para debugging)
  static async clearCache(_req: Request, res: Response): Promise<void> {
    try {
      CryptoApiService.clearCache();
      
      res.status(200).json({
        success: true,
        message: 'Caché limpiada exitosamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Error limpiando caché',
        error: error.message
      });
    }
  }

  // Endpoint para obtener símbolos disponibles
  static async getAvailableSymbols(_req: Request, res: Response): Promise<void> {
    try {
      const symbols = await CryptoApiService.getAvailableSymbols();
      
      // Organizar por moneda base para mejor visualización
      const symbolsByBase = symbols.reduce((acc: any, symbol) => {
        const base = symbol.base_currency.toUpperCase();
        if (!acc[base]) {
          acc[base] = [];
        }
        acc[base].push({
          symbol: symbol.symbol,
          quoteCurrency: symbol.quote_currency.toUpperCase(),
          minOrderSize: symbol.min_order_size,
          status: symbol.status
        });
        return acc;
      }, {});

      // Obtener las monedas más populares
      const popularPairs = symbols
        .filter(s => ['USD', 'BTC', 'EUR'].includes(s.quote_currency.toUpperCase()))
        .slice(0, 20)
        .map(s => ({
          symbol: s.symbol,
          baseCurrency: s.base_currency.toUpperCase(),
          quoteCurrency: s.quote_currency.toUpperCase(),
          minOrderSize: s.min_order_size
        }));

      res.status(200).json({
        success: true,
        data: {
          total: symbols.length,
          popular: popularPairs,
          byBaseCurrency: symbolsByBase,
          examples: {
            bitcoin: 'btcusd',
            ethereum: 'ethusd',
            litecoin: 'ltcusd',
            cardano: 'adausd'
          }
        },
        message: 'Símbolos obtenidos exitosamente',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error getting available symbols:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo símbolos disponibles',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}
