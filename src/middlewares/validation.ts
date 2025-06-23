import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult, ValidationChain } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
    return;
  }
  next();
};

// Validaciones para registro
export const registerValidation: ValidationChain[] = [
  body('username')
    .isLength({ min: 3, max: 25 })
    .withMessage('El username debe tener entre 3 y 25 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El username solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('firstName')
    .isLength({ min: 2, max: 25 })
    .withMessage('El nombre debe tener entre 2 y 25 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  
  body('lastName')
    .isLength({ min: 2, max: 25 })
    .withMessage('El apellido debe tener entre 2 y 25 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios'),
  
  body('phone')
    .optional()
    .isLength({ min: 8, max: 10 })
    .withMessage('El teléfono debe tener entre 8 y 10 dígitos')
    .isNumeric()
    .withMessage('El teléfono solo puede contener números')
];

// Validaciones para login
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para parámetros de ID
export const validateId = [
  body('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
];

// Validaciones para parámetros de paginación
export const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
];

// Objeto de validaciones para mantener compatibilidad
export const validateAuth = {
  register: registerValidation,
  login: loginValidation
};


// Validaciones para exchanges
export const exchangeValidation = {
  create: [
    body('to_user_id')
      .isInt({ min: 1 })
      .withMessage('ID de usuario destino debe ser un número entero positivo'),
    
    body('from_currency_id')
      .isInt({ min: 1 })
      .withMessage('ID de moneda origen debe ser un número entero positivo'),
    
    body('to_currency_id')
      .isInt({ min: 1 })
      .withMessage('ID de moneda destino debe ser un número entero positivo'),
    
    body('from_amount')
      .isDecimal({ decimal_digits: '0,8' })
      .withMessage('Cantidad origen debe ser un número decimal válido')
      .custom((value) => {
        if (parseFloat(value) <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }
        return true;
      }),
    
    handleValidationErrors
  ],

  // Validación para actualizar estado
  updateStatus: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero positivo'),
    
    body('status')
      .isIn(['pending', 'completed', 'failed'])
      .withMessage('Estado debe ser: pending, completed o failed'),
    
    handleValidationErrors
  ]
};

// Validacion de wallet
export const validateWallet = {
  create: [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('El ID de usuario debe ser un número entero positivo'),
    body('cryptocurrencyId')
      .isInt({ min: 1 })
      .withMessage('El ID de criptomoneda debe ser un número entero positivo'),
    body('balance')
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
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID de wallet debe ser un número entero positivo'),
    body('balance')
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
    body('fromWalletId')
      .isInt({ min: 1 })
      .withMessage('El ID de la wallet de origen debe ser un número entero positivo'),
    body('toWalletId')
      .isInt({ min: 1 })
      .withMessage('El ID de la wallet de destino debe ser un número entero positivo'),
    body('amount')
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
