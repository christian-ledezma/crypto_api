import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // POST /api/auth/login
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      // Generar JWT
      if (!config.security.jwtSecret) {
        res.status(500).json({ error: 'Configuración JWT no encontrada' });
        return;
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      );

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
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
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
      const { token } = req.body;
      
      if (!token) {
        res.status(401).json({ error: 'Token requerido' });
        return;
      }

      if (!config.security.jwtSecret) {
        res.status(500).json({ error: 'Configuración JWT no encontrada' });
        return;
      }

      // Verificar token actual
      const decoded = jwt.verify(token, config.security.jwtSecret) as any;
      
      // Generar nuevo token
      const newToken = jwt.sign(
        { 
          id: decoded.id, 
          username: decoded.username, 
          email: decoded.email 
        },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Token renovado',
        token: newToken
      });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
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
