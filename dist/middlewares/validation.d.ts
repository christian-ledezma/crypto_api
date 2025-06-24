import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const registerValidation: ValidationChain[];
export declare const loginValidation: ValidationChain[];
export declare const validateId: ValidationChain[];
export declare const validatePagination: ValidationChain[];
export declare const validateAuth: {
    register: ValidationChain[];
    login: ValidationChain[];
};
export declare const exchangeValidation: {
    create: (((req: Request, res: Response, next: NextFunction) => void) | ValidationChain)[];
    updateStatus: (((req: Request, res: Response, next: NextFunction) => void) | ValidationChain)[];
};
export declare const validateWallet: {
    create: ValidationChain[];
    updateBalance: ValidationChain[];
    transfer: ValidationChain[];
};
//# sourceMappingURL=validation.d.ts.map