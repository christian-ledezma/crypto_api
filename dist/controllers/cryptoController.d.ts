import { Request, Response } from 'express';
export declare const CryptoController: {
    getAllCryptocurrencies: (_req: Request, res: Response) => Promise<void>;
    getCryptocurrencyById: (req: Request, res: Response) => Promise<void>;
    getCurrentPrice: (req: Request, res: Response) => Promise<void>;
    getCryptocurrencyBySymbol: (req: Request, res: Response) => Promise<void>;
    getCryptocurrencyStats: (_req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=cryptoController.d.ts.map