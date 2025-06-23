import { Request, Response } from 'express';
export declare const WalletController: {
    getUserWallets: (req: Request, res: Response) => Promise<void>;
    getWallet: (req: Request, res: Response) => Promise<void>;
    getUserWalletForCrypto: (req: Request, res: Response) => Promise<void>;
    createWallet: (req: Request, res: Response) => Promise<void>;
    updateWalletBalance: (req: Request, res: Response) => Promise<void>;
    transferBetweenWallets: (req: Request, res: Response) => Promise<void>;
    getUserTotalBalance: (req: Request, res: Response) => Promise<void>;
    deleteWallet: (req: Request, res: Response) => Promise<void>;
    getBalanceByCrypto: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=walletController.d.ts.map