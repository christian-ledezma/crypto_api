import { Exchange } from '../models/Exchange';
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
export declare class ExchangeService {
    static createExchange(exchangeData: CreateExchangeData): Promise<Exchange>;
    static processExchange(exchangeId: number): Promise<Exchange>;
    static getExchangeById(exchangeId: number): Promise<Exchange | null>;
    static getUserExchanges(userId: number, limit?: number, offset?: number): Promise<ExchangeWithDetails[]>;
    static getExchangesByStatus(status: ExchangeStatus, limit?: number, offset?: number): Promise<ExchangeWithDetails[]>;
    static cancelExchange(exchangeId: number, userId: number): Promise<Exchange>;
    static getUserExchangeStats(userId: number): Promise<any>;
    private static validateUser;
    private static validateCryptocurrency;
    private static validateUserBalance;
    private static updateWalletBalance;
    private static markExchangeAsFailed;
    private static mapRowToExchange;
    private static mapRowToExchangeWithDetails;
    static getUserSentExchanges(userId: number, limit?: number, offset?: number): Promise<ExchangeWithDetails[]>;
    static getUserReceivedExchanges(userId: number, limit?: number, offset?: number): Promise<ExchangeWithDetails[]>;
}
export {};
//# sourceMappingURL=exchangeService.d.ts.map