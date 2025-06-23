import { User } from './User';
import { Cryptocurrency } from './Cryptocurrency';
export interface Wallet {
    id: number;
    user_id: number;
    cryptocurrency_id: number;
    balance: number;
    created_at: Date;
    updated_at: Date;
}
export interface WalletWithDetails extends Wallet {
    user: User;
    cryptocurrency: Cryptocurrency;
}
export interface CreateWalletInput {
    user_id: number;
    cryptocurrency_id: number;
    balance?: number;
}
export interface UpdateWalletBalance {
    balance: number;
}
//# sourceMappingURL=Wallet.d.ts.map