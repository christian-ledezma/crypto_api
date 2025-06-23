"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token de acceso requerido' });
        return;
    }
    if (!config_1.default.security.jwtSecret) {
        res.status(500).json({ error: 'Configuración de JWT no encontrada' });
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.default.security.jwtSecret, (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Token inválido o expirado' });
            return;
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, _res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }
    if (!config_1.default.security.jwtSecret) {
        next();
        return;
    }
    jsonwebtoken_1.default.verify(token, config_1.default.security.jwtSecret, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map