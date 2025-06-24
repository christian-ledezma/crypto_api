import { Cryptocurrency } from '../models/Cryptocurrency';
export declare const cryptoService: {
    getAllCryptocurrencies: () => Promise<Cryptocurrency[]>;
    getCryptocurrencyById: (id: number) => Promise<Cryptocurrency | null>;
    getCurrentPrice: (symbol: string) => Promise<number | null>;
    getCryptocurrencyBySymbol: (symbol: string) => Promise<Cryptocurrency | null>;
    isActiveCryptocurrency: (id: number) => Promise<boolean>;
    getCryptocurrencyStats: () => Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
};
//# sourceMappingURL=cryptoService.d.ts.map