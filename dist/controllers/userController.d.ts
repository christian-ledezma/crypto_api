import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}
export declare const userController: {
    createUser: (req: Request, res: Response) => Promise<void>;
    getProfile: (req: AuthRequest, res: Response) => Promise<void>;
    getUserById: (req: AuthRequest, res: Response) => Promise<void>;
};
export {};
//# sourceMappingURL=userController.d.ts.map