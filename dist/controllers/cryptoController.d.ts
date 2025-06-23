import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export declare const CryptoController: {
    getAllCryptocurrencies: (_req: Request, res: Response) => Promise<void>;
    getCurrentPrice: (req: Request, res: Response) => Promise<void>;
    getActiveCryptocurrencies: (_req: Request, res: Response) => Promise<void>;
    getCryptocurrencyById: (req: Request, res: Response) => Promise<void>;
    getCryptocurrencyBySymbol: (req: Request, res: Response) => Promise<void>;
    createCryptocurrency: (req: AuthRequest, res: Response) => Promise<void>;
    updateCryptocurrency: (req: AuthRequest, res: Response) => Promise<void>;
    deactivateCryptocurrency: (req: AuthRequest, res: Response) => Promise<void>;
    activateCryptocurrency: (req: AuthRequest, res: Response) => Promise<void>;
    getCryptocurrencyStats: (_req: Request, res: Response) => Promise<void>;
};
export {};
//# sourceMappingURL=cryptoController.d.ts.map