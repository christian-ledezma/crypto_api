"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWallet = exports.exchangeValidation = exports.validateAuth = exports.validatePagination = exports.validateId = exports.loginValidation = exports.registerValidation = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.registerValidation = [
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 25 })
        .withMessage('El username debe tener entre 3 y 25 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El username solo puede contener letras, números y guiones bajos'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
    (0, express_validator_1.body)('firstName')
        .isLength({ min: 2, max: 25 })
        .withMessage('El nombre debe tener entre 2 y 25 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    (0, express_validator_1.body)('lastName')
        .isLength({ min: 2, max: 25 })
        .withMessage('El apellido debe tener entre 2 y 25 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El apellido solo puede contener letras y espacios'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isLength({ min: 8, max: 10 })
        .withMessage('El teléfono debe tener entre 8 y 10 dígitos')
        .isNumeric()
        .withMessage('El teléfono solo puede contener números')
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];
exports.validateId = [
    (0, express_validator_1.body)('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];
exports.validatePagination = [
    (0, express_validator_1.body)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo'),
    (0, express_validator_1.body)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];
exports.validateAuth = {
    register: exports.registerValidation,
    login: exports.loginValidation
};
exports.exchangeValidation = {
    create: [
        (0, express_validator_1.body)('to_user_id')
            .isInt({ min: 1 })
            .withMessage('ID de usuario destino debe ser un número entero positivo'),
        (0, express_validator_1.body)('from_currency_id')
            .isInt({ min: 1 })
            .withMessage('ID de moneda origen debe ser un número entero positivo'),
        (0, express_validator_1.body)('to_currency_id')
            .isInt({ min: 1 })
            .withMessage('ID de moneda destino debe ser un número entero positivo'),
        (0, express_validator_1.body)('from_amount')
            .isDecimal({ decimal_digits: '0,8' })
            .withMessage('Cantidad origen debe ser un número decimal válido')
            .custom((value) => {
            if (parseFloat(value) <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }
            return true;
        }),
        exports.handleValidationErrors
    ],
    updateStatus: [
        (0, express_validator_1.param)('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        (0, express_validator_1.body)('status')
            .isIn(['pending', 'completed', 'failed'])
            .withMessage('Estado debe ser: pending, completed o failed'),
        exports.handleValidationErrors
    ]
};
exports.validateWallet = {
    create: [
        (0, express_validator_1.body)('userId')
            .isInt({ min: 1 })
            .withMessage('El ID de usuario debe ser un número entero positivo'),
        (0, express_validator_1.body)('cryptocurrencyId')
            .isInt({ min: 1 })
            .withMessage('El ID de criptomoneda debe ser un número entero positivo'),
        (0, express_validator_1.body)('balance')
            .optional()
            .isDecimal({ decimal_digits: '0,8' })
            .withMessage('El balance debe ser un número decimal válido')
            .custom((value) => {
            if (value !== undefined && parseFloat(value) < 0) {
                throw new Error('El balance no puede ser negativo');
            }
            return true;
        })
    ],
    updateBalance: [
        (0, express_validator_1.param)('id')
            .isInt({ min: 1 })
            .withMessage('El ID de wallet debe ser un número entero positivo'),
        (0, express_validator_1.body)('balance')
            .isDecimal({ decimal_digits: '0,8' })
            .withMessage('El balance debe ser un número decimal válido')
            .custom((value) => {
            if (value !== undefined && parseFloat(value) < 0) {
                throw new Error('El balance no puede ser negativo');
            }
            return true;
        })
    ],
    transfer: [
        (0, express_validator_1.body)('fromWalletId')
            .isInt({ min: 1 })
            .withMessage('El ID de la wallet de origen debe ser un número entero positivo'),
        (0, express_validator_1.body)('toWalletId')
            .isInt({ min: 1 })
            .withMessage('El ID de la wallet de destino debe ser un número entero positivo'),
        (0, express_validator_1.body)('amount')
            .isDecimal({ decimal_digits: '0,8' })
            .withMessage('El monto debe ser un número decimal válido')
            .custom((value) => {
            if (parseFloat(value) <= 0) {
                throw new Error('El monto debe ser mayor a 0');
            }
            return true;
        })
    ]
};
//# sourceMappingURL=validation.js.map