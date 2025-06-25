import { Request, Response } from 'express';
//import bcrypt from 'bcrypt';
import { AuthService } from '../services/authService';
import { RegisterRequest } from '../models/User';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authController = {
  // POST /api/auth/register - CORREGIDO  
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body as RegisterRequest;
      
      // Validar campos requeridos
      if (!userData.password || !userData.email || !userData.username) {
        res.status(400).json({ 
          error: 'Email, username y contraseña son requeridos' 
        });
        return;
      }

      console.log('Datos de registro recibidos:', {
        ...userData,
        password: '[OCULTO]' // No logear la contraseña
      });

      // Usar AuthService directamente (él se encarga del hash)
      const registerResponse = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: registerResponse.user,
        tokens: registerResponse.tokens
      });
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos
      if (error.message === 'El correo ya está registrado') {
        res.status(409).json({ error: error.message });
      } else if (error.message.includes('already exists') || error.message.includes('UNIQUE constraint')) {
        res.status(409).json({ error: 'El usuario ya existe' });
      } else {
        res.status(500).json({ 
          error: 'Error interno del servidor',
          details: error.message // Solo en desarrollo
        });
      }
    }
  },

  // POST /api/auth/login - MEJORADO
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 === INICIO DEBUG LOGIN ===');
      console.log('📨 Headers recibidos:', JSON.stringify(req.headers, null, 2));
      console.log('📦 Body recibido:', { ...req.body, password: '[HIDDEN]' });
      console.log('🔧 Content-Type:', req.headers['content-type']);
      console.log('📍 URL:', req.url);
      console.log('🔀 Method:', req.method);

      const { email, password } = req.body;

      // Validar que los datos lleguen
      if (!email || !password) {
        console.log('❌ FALLO: Faltan email o password');
        console.log('📧 Email recibido:', email);
        console.log('🔑 Password recibido:', password ? '[PRESENTE]' : '[AUSENTE]');
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
      }

      console.log('✅ Datos válidos recibidos');
      console.log('📧 Email a procesar:', email);
      console.log('🔑 Password presente:', !!password);

      // Llamar al AuthService
      console.log('🚀 Llamando a AuthService.login...');
      const loginResponse = await AuthService.login(email, password);
      console.log('✅ AuthService.login exitoso');

      // Respuesta exitosa
      const response = {
        success: true,
        message: 'Login exitoso',
        token: loginResponse.tokens.accessToken,
        refreshToken: loginResponse.tokens.refreshToken,
        expiresIn: loginResponse.tokens.expiresIn,
        user: {
          id: loginResponse.user.id,
          username: loginResponse.user.username,
          email: loginResponse.user.email,
          first_name: loginResponse.user.first_name,
          last_name: loginResponse.user.last_name,
          email_verified: loginResponse.user.email_verified
        }
      };

      console.log('📤 Enviando respuesta exitosa:', { ...response, token: '[HIDDEN]' });
      res.json(response);

    } catch (error: any) {
      console.log('🚨 === ERROR EN LOGIN ===');
      console.error('❌ Error completo:', error);
      console.error('📋 Error message:', error.message);
      console.error('📊 Error stack:', error.stack);
      console.error('🔍 Error type:', typeof error);
      console.error('🏷️ Error constructor:', error.constructor.name);
      
      if (error?.message === 'Credenciales inválidas') {
        console.log('🔐 Enviando 401 - Credenciales inválidas');
        res.status(401).json({ 
          error: 'Credenciales inválidas',
          success: false 
        });
      } else {
        console.log('💥 Enviando 500 - Error interno');
        res.status(500).json({ 
          error: 'Error interno del servidor',
          success: false,
          details: error.message
        });
      }
    }
  },


  // POST /api/auth/logout
  logout: async (_req: Request, res: Response): Promise<void> => {
    // En JWT stateless, el logout se maneja en el frontend
    res.json({ 
      success: true,
      message: 'Logout exitoso' 
    });
  },

  // POST /api/auth/refresh
  refreshToken: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(401).json({ 
          error: 'Refresh token requerido',
          success: false 
        });
        return;
      }

      // Usar el AuthService para refrescar el token
      const newTokens = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: 'Token renovado',
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn
      });
    } catch (error: any) {
      console.error('Error renovando token:', error);
      res.status(401).json({ 
        error: 'Refresh token inválido o expirado',
        success: false 
      });
    }
  },

  // GET /api/auth/me - Obtener usuario actual
  getCurrentUser: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'No autenticado',
          success: false 
        });
        return;
      }

      res.json({
        success: true,
        user: req.user
      });
    } catch (error: any) {
      console.error('Error obteniendo usuario actual:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        success: false 
      });
    }
  },

  // POST /api/auth/verify-email
  verifyEmail: async (_req: Request, res: Response): Promise<void> => {
    res.json({ 
      message: 'Verificación de email - Por implementar',
      success: true 
    });
  },

  // POST /api/auth/forgot-password
  forgotPassword: async (_req: Request, res: Response): Promise<void> => {
    res.json({ 
      message: 'Recuperación de contraseña - Por implementar',
      success: true 
    });
  }
};