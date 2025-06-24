import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export declare class ExchangeController {
    static getUserExchanges(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSentExchanges(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getReceivedExchanges(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getExchangeById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createExchange(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static acceptExchange(req: AuthenticatedRequest, res: Response): Promise<void>;
    static rejectExchange(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=exchangeController.d.ts.map