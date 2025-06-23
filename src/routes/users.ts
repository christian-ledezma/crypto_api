import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';
import { registerValidation } from '../middlewares/validation';

const router = Router();

// POST /api/users/register - Crear nuevo usuario (registro)
router.post('/register', registerValidation, userController.createUser);

// GET /api/users/profile - Obtener perfil del usuario
router.get('/profile', authenticateToken, userController.getProfile);

// GET /api/users/:id - Obtener usuario por ID (admin)
router.get('/:id', authenticateToken, userController.getUserById);

export default router;
