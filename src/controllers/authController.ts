import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthService } from '../services/authService';
import { CreateUserInput } from '../models/User';
import config from '../config';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authController = {
  // POST /api/auth/register
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUserInput = req.body;
      
      // Verificar si el usuario ya existe
      const existingUser = await AuthService.findUserByEmail(userData.email);
      if (existingUser) {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
      }

      const existingUserName = await AuthService.findUserByUsername(userData.username);
      if (existingUserName) {
        res.status(409).json({ error: 'El username ya está en uso' });
        return;
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(userData.password_hash, config.security.bcryptRounds);
      
      // Crear usuario
      const registerResponse = await AuthService.register({
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
    } catch (error: any) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // POST /api/auth/login - VERSIÓN CORREGIDA
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validar que los datos lleguen
      if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
      }

      console.log('Intentando login para:', email); // Debug

      // Usar el AuthService que ya maneja toda la lógica
      const loginResponse = await AuthService.login(email, password);

      res.json({
        message: 'Login exitoso',
        token: loginResponse.tokens.accessToken,
        refreshToken: loginResponse.tokens.refreshToken,
        user: {
          id: loginResponse.user.id,
          username: loginResponse.user.username,
          email: loginResponse.user.email,
          first_name: loginResponse.user.first_name,
          last_name: loginResponse.user.last_name
        }
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      
      if (error?.message === 'Credenciales inválidas') {
        res.status(401).json({ error: 'Credenciales inválidas' });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  },

  // POST /api/auth/logout
  logout: async (_req: Request, res: Response): Promise<void> => {
    // En JWT stateless, el logout se maneja en el frontend
    res.json({ message: 'Logout exitoso' });
  },

  // POST /api/auth/refresh
  refreshToken: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token requerido' });
        return;
      }

      // Usar el AuthService para refrescar el token
      const newTokens = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        message: 'Token renovado',
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      });
    } catch (error: any) {
      console.error('Error renovando token:', error);
      res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }
  },

  // POST /api/auth/verify-email
  verifyEmail: async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: 'Verificación de email - Por implementar' });
  },

  // POST /api/auth/forgot-password
  forgotPassword: async (_req: Request, res: Response): Promise<void> => {
    res.json({ message: 'Recuperación de contraseña - Por implementar' });
  }
};
