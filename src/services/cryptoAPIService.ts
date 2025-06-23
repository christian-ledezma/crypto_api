import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface GeminiSymbol {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  min_order_size: string;
  status: string;
}

interface GeminiTicker {
  symbol: string;
  close: string;
}

interface CryptoPriceData {
  symbol: string;
  price: number;
  lastUpdate: Date;
}

interface ExchangeRateData {
  fromSymbol: string;
  toSymbol: string;
  rate: number;
  timestamp: Date;
}

export class CryptoApiService {
  private static readonly BASE_URL = 'https://api.gemini.com';
  private static readonly SANDBOX_URL = 'https://api.sandbox.gemini.com';
  private static apiClient: AxiosInstance;
  private static readonly CACHE_TTL = 30000; // 30 segundos
  private static cache = new Map<string, { data: any; timestamp: number }>();

  // Inicializar servicio
  static initialize(): void {
    const baseURL = process.env.NODE_ENV === 'production' ? this.BASE_URL : this.SANDBOX_URL;
    
    this.apiClient = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'crypto-exchange-api/1.0'
      }
    });

    // Logging básico
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log(`🚀 Crypto API: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`✅ Crypto API Response: ${response.status}`);
        return response;
      },
      (error) => {
        console.error(`❌ Crypto API Error: ${error.response?.status}`, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number; details: any }> {
    const startTime = Date.now();
    
    try {
      const response = await this.apiClient.get('/v1/symbols', { timeout: 5000 });
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
        details: { symbolsCount: response.data?.length || 0 }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  // Obtener símbolos disponibles (cached)
static async getAvailableSymbols(): Promise<GeminiSymbol[]> {
  const cacheKey = 'symbols';
  const cached = this.getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response: AxiosResponse<string[]> = await this.apiClient.get('/v1/symbols');
    
    // Para obtener los detalles, necesitamos hacer otra petición
    const detailsResponse: AxiosResponse<GeminiSymbol[]> = await this.apiClient.get('/v1/symbols/details');
    
    // Filtrar solo los símbolos disponibles y mapear con sus detalles
    const availableSymbols = response.data;
    const symbolsDetails = detailsResponse.data;
    
    const symbols = availableSymbols
      .map(symbol => symbolsDetails.find(detail => detail.symbol === symbol))
      .filter((symbol): symbol is GeminiSymbol => symbol !== undefined && symbol.status === 'open');
    
    this.setCache(cacheKey, symbols, 300000);
    return symbols;
  } catch (error: any) {
    console.error('Error obteniendo símbolos:', {
      message: error.message,
      response: error.response?.data,
      url: error.config?.url
    });
    
    // Fallback con símbolos básicos si la API falla
    const fallbackSymbols: GeminiSymbol[] = [
      {
        symbol: 'btcusd',
        base_currency: 'btc',
        quote_currency: 'usd',
        min_order_size: '0.00001',
        status: 'open'
      },
      {
        symbol: 'ethusd',
        base_currency: 'eth',
        quote_currency: 'usd',
        min_order_size: '0.001',
        status: 'open'
      }
    ];
    
    console.warn('Usando símbolos de fallback');
    return fallbackSymbols;
  }
}

  // Obtener precio actual (lo más importante para intercambios)
static async getCurrentPrice(symbol: string): Promise<CryptoPriceData> {
    // Normaliza el símbolo (remueve 'usd' duplicado si existe)
    const normalizedSymbol = symbol.toLowerCase().replace(/usd$/, '') + 'usd';
    const baseSymbol = normalizedSymbol.replace(/usd$/, ''); // Definimos baseSymbol aquí
    
    const cacheKey = `price_${normalizedSymbol}`;
    
    try {
        // Verificar si el símbolo es válido (usando baseSymbol)
        const isValid = await this.isValidSymbol(baseSymbol);
        
        if (!isValid) {
            throw new Error(`Símbolo ${baseSymbol} no soportado`);
        }

        const response: AxiosResponse<GeminiTicker> = await this.apiClient.get(
            `/v1/pubticker/${normalizedSymbol}`,
            { timeout: 3000 }
        );

        if (!response.data?.close) {
            throw new Error('Formato de respuesta inesperado');
        }

        const price = parseFloat(response.data.close);
        if (isNaN(price)) {
            throw new Error('Precio no numérico recibido');
        }

        const priceData: CryptoPriceData = {
            symbol: baseSymbol.toUpperCase(),
            price: price,
            lastUpdate: new Date()
        };

        this.setCache(cacheKey, priceData, 10000);
        return priceData;
    } catch (error: any) {
        console.error(`Error obteniendo precio para ${normalizedSymbol}:`, error);
        throw new Error(`No se pudo obtener el precio de ${baseSymbol}: ${error.message}`);
    }
}


  // Obtener tasa de cambio (esencial para intercambios)
  static async getExchangeRate(fromSymbol: string, toSymbol: string): Promise<ExchangeRateData> {
    const cacheKey = `rate_${fromSymbol}_${toSymbol}`.toLowerCase();
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Mismo símbolo = tasa 1
      if (fromSymbol.toLowerCase() === toSymbol.toLowerCase()) {
        return {
          fromSymbol: fromSymbol.toUpperCase(),
          toSymbol: toSymbol.toUpperCase(),
          rate: 1,
          timestamp: new Date()
        };
      }

      // Obtener precios en USD
      const [fromPrice, toPrice] = await Promise.all([
        this.getCurrentPrice(`${fromSymbol}usd`),
        this.getCurrentPrice(`${toSymbol}usd`)
      ]);

      const exchangeRate: ExchangeRateData = {
        fromSymbol: fromSymbol.toUpperCase(),
        toSymbol: toSymbol.toUpperCase(),
        rate: fromPrice.price / toPrice.price,
        timestamp: new Date()
      };

      this.setCache(cacheKey, exchangeRate, 15000); // Cache por 15 segundos
      return exchangeRate;
    } catch (error) {
      console.error(`Error obteniendo tasa ${fromSymbol}/${toSymbol}:`, error);
      throw new Error(`No se pudo obtener la tasa de cambio`);
    }
  }

  // Validar símbolo
  static async isValidSymbol(symbol: string): Promise<boolean> {
    try {
      const symbols = await this.getAvailableSymbols();
      return symbols.some(s => s.symbol.toLowerCase() === symbol.toLowerCase());
    } catch (error) {
      return false;
    }
  }

  // Calcular cantidad de intercambio
  static calculateExchangeAmount(fromAmount: number, exchangeRate: number): number {
    return Number((fromAmount * exchangeRate).toFixed(8));
  }

  // Validar cantidad mínima
  static async validateTradingAmount(symbol: string, amount: number): Promise<boolean> {
    try {
      const symbols = await this.getAvailableSymbols();
      const symbolInfo = symbols.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      
      if (!symbolInfo) return false;
      
      const minOrderSize = parseFloat(symbolInfo.min_order_size);
      return amount >= minOrderSize && amount <= 1000000;
    } catch (error) {
      return amount > 0 && amount <= 1000000;
    }
  }

  // Gestión de caché
  private static getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  // Limpiar caché
  static clearCache(): void {
    this.cache.clear();
  }

  // Estadísticas
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Inicializar
CryptoApiService.initialize();