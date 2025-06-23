"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const userService_1 = require("../services/userService");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config"));
exports.userController = {
    createUser: async (req, res) => {
        try {
            const { username, email, password, first_name, last_name, phone } = req.body;
            if (!username || !email || !password || !first_name || !last_name) {
                res.status(400).json({
                    error: 'Faltan campos requeridos: username, email, password, first_name, last_name'
                });
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ error: 'Formato de email inválido' });
                return;
            }
            if (password.length < 6) {
                res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
                return;
            }
            const userData = {
                username,
                email,
                password_hash: password,
                first_name,
                last_name,
                phone
            };
            const newUser = await userService_1.UserService.createUser(userData);
            const { password_hash, ...userResponse } = newUser;
            res.status(201).json({
                message: 'Usuario creado exitosamente',
                user: userResponse
            });
        }
        catch (error) {
            console.error('Error creando usuario:', error);
            if (error.message === 'El usuario ya existe con este email') {
                res.status(409).json({ error: 'El email ya está registrado' });
                return;
            }
            if (error.message === 'El username ya está en uso') {
                res.status(409).json({ error: 'El username ya está en uso' });
                return;
            }
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getProfile: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const user = await userService_1.UserService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            const { password_hash, ...userProfile } = user;
            res.json({
                message: 'Perfil obtenido exitosamente',
                user: userProfile
            });
        }
        catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    updateProfile: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const updateData = req.body;
            const updatedUser = await userService_1.UserService.updateUser(req.user.id, updateData);
            if (!updatedUser) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            const { password_hash, ...userProfile } = updatedUser;
            res.json({
                message: 'Perfil actualizado exitosamente',
                user: userProfile
            });
        }
        catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await userService_1.UserService.getUserById(parseInt(id));
            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            res.json({
                user: {
                    id: user.id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            });
        }
        catch (error) {
            console.error('Error obteniendo usuario:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    deleteAccount: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            await userService_1.UserService.deleteUser(req.user.id);
            res.json({ message: 'Cuenta eliminada exitosamente' });
        }
        catch (error) {
            console.error('Error eliminando cuenta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },
    changePassword: async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            const user = await userService_1.UserService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }
            const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.password_hash);
            if (!isValidPassword) {
                res.status(400).json({ error: 'Contraseña actual incorrecta' });
                return;
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, config_1.default.security.bcryptRounds);
            await userService_1.UserService.changePassword(req.user.id, hashedPassword);
            res.json({ message: 'Contraseña cambiada exitosamente' });
        }
        catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};
//# sourceMappingURL=userController.js.map