import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateAuth } from '../middlewares/validation';

const router = Router();

// POST /api/auth/register - Registrar usuario
router.post('/register', validateAuth.register, authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateAuth.login, authController.login);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authController.logout);

// POST /api/auth/refresh - Renovar token
router.post('/refresh', authController.refreshToken);

// POST /api/auth/verify-email - Verificar email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/forgot-password - Recuperar contraseña
router.post('/forgot-password', authController.forgotPassword);

export default router;