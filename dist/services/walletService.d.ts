import { Wallet } from '../models/Wallet';
import { RowDataPacket } from 'mysql2';
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
export interface WalletWithCrypto extends Wallet {
    cryptoSymbol: string;
    cryptoName: string;
}
export declare const walletService: {
    getUserWallets: (userId: number) => Promise<WalletWithCrypto[]>;
    getWallet: (walletId: number) => Promise<WalletWithCrypto | null>;
    getBalanceByCrypto: (userId: number, cryptoId: number) => Promise<WalletWithCrypto | null>;
    getUserWalletForCrypto: (userId: number, cryptocurrencyId: number) => Promise<WalletWithCrypto | null>;
    createWallet: (userId: number, cryptocurrencyId: number) => Promise<WalletWithCrypto>;
    updateWalletBalance: (walletId: number, amount: number, operation: "add" | "subtract" | "set") => Promise<WalletWithCrypto>;
    transferBetweenWallets: (fromWalletId: number, toWalletId: number, amount: number) => Promise<{
        fromWallet: WalletWithCrypto;
        toWallet: WalletWithCrypto;
    }>;
    deleteWallet: (walletId: number) => Promise<boolean>;
    mapRowToWalletWithCrypto: (row: WalletRowWithCrypto) => WalletWithCrypto;
};
export {};
//# sourceMappingURL=walletService.d.ts.map