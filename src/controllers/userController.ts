import { Request, Response } from 'express';
import { UserService } from '../services/userService';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}


export const userController = {
  // POST /api/users/register
  createUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, first_name, last_name, phone } = req.body;

      // Validar campos requeridos
      if (!username || !email || !password || !first_name || !last_name) {
        res.status(400).json({ 
          error: 'Faltan campos requeridos: username, email, password, first_name, last_name' 
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Formato de email inválido' });
        return;
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      const userData = {
        username,
        email,
        password_hash: password, // Se hashea en el servicio
        first_name,
        last_name,
        phone
      };

      const newUser = await UserService.createUser(userData);

      // No retornar password_hash
      const { password_hash, ...userResponse } = newUser;

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        user: userResponse
      });
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      
      // Manejar errores específicos
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

  // GET /api/users/profile
  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const user = await UserService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // No retornar password_hash
      const { password_hash, ...userProfile } = user;
      
      res.json({
        message: 'Perfil obtenido exitosamente',
        user: userProfile
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // GET /api/users/:id
  getUserById: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(parseInt(id));

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Solo información pública
      res.json({
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  
};
