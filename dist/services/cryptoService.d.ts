import { Cryptocurrency, CreateCryptocurrencyInput, UpdateCryptocurrencyInput } from '../models/Cryptocurrency';
export declare const cryptoService: {
    getAllCryptocurrencies: () => Promise<Cryptocurrency[]>;
    getCurrentPrice: (symbol: string) => Promise<number | null>;
    getActiveCryptocurrencies: () => Promise<Cryptocurrency[]>;
    getCryptocurrencyById: (id: number) => Promise<Cryptocurrency | null>;
    getCryptocurrencyBySymbol: (symbol: string) => Promise<Cryptocurrency | null>;
    createCryptocurrency: (cryptocurrencyData: CreateCryptocurrencyInput) => Promise<Cryptocurrency>;
    updateCryptocurrency: (id: number, updateData: UpdateCryptocurrencyInput) => Promise<Cryptocurrency | null>;
    deactivateCryptocurrency: (id: number) => Promise<boolean>;
    activateCryptocurrency: (id: number) => Promise<boolean>;
    isActiveCryptocurrency: (id: number) => Promise<boolean>;
    getCryptocurrencyStats: () => Promise<{
        total: number;
        active: number;
        inactive: number;
    }>;
};
//# sourceMappingURL=cryptoService.d.ts.map