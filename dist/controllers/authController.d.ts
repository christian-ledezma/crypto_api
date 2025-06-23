import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export declare const authController: {
    register: (req: Request, res: Response) => Promise<void>;
    login: (req: Request, res: Response) => Promise<void>;
    logout: (_req: Request, res: Response) => Promise<void>;
    refreshToken: (req: AuthRequest, res: Response) => Promise<void>;
    verifyEmail: (_req: Request, res: Response) => Promise<void>;
    forgotPassword: (_req: Request, res: Response) => Promise<void>;
};
export {};
//# sourceMappingURL=authController.d.ts.map