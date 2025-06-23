"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (error, req, res, _next) => {
    console.error('Error capturado:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({
            error: 'Ya existe un registro con esos datos',
            message: 'Conflicto de datos únicos'
        });
        return;
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({
            error: 'Referencia inválida',
            message: 'El ID referenciado no existe'
        });
        return;
    }
    if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
            error: 'Servicio no disponible',
            message: 'Error de conexión a la base de datos'
        });
        return;
    }
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            error: 'Token inválido',
            message: 'Token de autenticación malformado'
        });
        return;
    }
    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            error: 'Token expirado',
            message: 'El token de autenticación ha expirado'
        });
        return;
    }
    if (error.statusCode) {
        res.status(error.statusCode).json({
            error: error.message || 'Error del servidor',
            message: 'Error en la operación solicitada'
        });
        return;
    }
    res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.path} no existe`,
        availableRoutes: [
            'GET /api/health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/users/profile',
            'GET /api/wallets',
            'GET /api/exchanges',
            'GET /api/cryptocurrencies'
        ]
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map