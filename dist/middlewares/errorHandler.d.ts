import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    code?: string;
}
export declare const errorHandler: (error: CustomError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map