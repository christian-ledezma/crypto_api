"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = require("../services/authService");
const config_1 = __importDefault(require("../config"));
exports.authController = {
    register: async (req, res) => {
        try {
            const userData = req.body;
            const existingUser = await authService_1.AuthService.findUserByEmail(userData.email);
            if (existingUser) {
                res.status(409).json({ error: 'El email ya está registrado' });
                return;
            }
            const existingUserName = await authService_1.AuthService.findUserByUsername(userData.username);
            if (existingUserName) {
                res.status(409).json({ error: 'El username ya está en uso' });
                return;
            }
            const hashedPassword = await bcrypt_1.default.hash(userData.password_hash, config_1.default.security.bcryptRounds);
            const registerResponse = await authService_1.AuthService.register({
                ...userData,
                password_hash: hashedPassword
            });
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                user: {
                    id: registerResponse.user.id,
                    username: registerResponse.user.username,
                    email: registerResponse.user.email,
                    first_name: registerResponse.user.first_name,
                    last_name: registerResponse.user.last_name
                }
            });
        }
        catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await authService_1.AuthService.findUserByEmail(email);
            if (!user) {
                res.status(401).json({ error: 'Credenciales inválidas' });
                return;
            }
            const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Credenciales inválidas' });
                return;
            }
            if (!config_1.default.security.jwtSecret) {
                res.status(500).json({ error: 'Configuración JWT no encontrada' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                username: user.username,
                email: user.email
            }, config_1.default.security.jwtSecret, { expiresIn: '24h' });
            res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            });
        }
        catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    logout: async (_req, res) => {
        res.json({ message: 'Logout exitoso' });
    },
    refreshToken: async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                res.status(401).json({ error: 'Token requerido' });
                return;
            }
            if (!config_1.default.security.jwtSecret) {
                res.status(500).json({ error: 'Configuración JWT no encontrada' });
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.security.jwtSecret);
            const newToken = jsonwebtoken_1.default.sign({
                id: decoded.id,
                username: decoded.username,
                email: decoded.email
            }, config_1.default.security.jwtSecret, { expiresIn: '24h' });
            res.json({
                message: 'Token renovado',
                token: newToken
            });
        }
        catch (error) {
            res.status(401).json({ error: 'Token inválido' });
        }
    },
    verifyEmail: async (_req, res) => {
        res.json({ message: 'Verificación de email - Por implementar' });
    },
    forgotPassword: async (_req, res) => {
        res.json({ message: 'Recuperación de contraseña - Por implementar' });
    }
};
//# sourceMappingURL=authController.js.map