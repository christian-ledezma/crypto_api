import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserService } from './userService';
import { User, CreateUserInput, RegisterRequest } from '../models/User';
import * as bcrypt from 'bcrypt';

interface TokenPayload {
  userId: number;
  email: string;
  username: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginResponse {
  user: Omit<User, 'password_hash'>; // Usuario sin password_hash
  tokens: AuthTokens;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

  // Registrar nuevo usuario - CORREGIDO
  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      console.log('AuthService.register - Datos recibidos:', {
        ...userData,
        password: '[OCULTO]'
      });

      // Verificar si el usuario ya existe
      const existingUser = await UserService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('El correo ya está registrado');
      }

      // Hashear la contraseña
      const password_hash = await bcrypt.hash(userData.password, 10);

      // Crear objeto para UserService (con password_hash, sin password)
      const createUserData: CreateUserInput = {
        username: userData.username,
        email: userData.email,
        password_hash, // <- Aquí está el hash
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        email_verified: userData.email_verified || false
      };

      console.log('AuthService.register - Creando usuario con:', {
        ...createUserData,
        password_hash: '[HASH_GENERADO]'
      });

      // Crear usuario
      const newUser = await UserService.createUser(createUserData);

      // Generar tokens
      const tokens = this.generateTokens({
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username
      });

      // Retornar usuario sin password_hash
      const { password_hash: _, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      console.error('Error en registro (AuthService):', error);
      throw error;
    }
  }

  // Iniciar sesión - MEJORADO
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('AuthService.login - Intentando login para:', email);
      
      const userWithPassword = await UserService.getUserWithPassword(email);
      
      if (!userWithPassword) {
        console.log('AuthService.login - Usuario no encontrado');
        throw new Error('Credenciales inválidas');
      }

      console.log('AuthService.login - Usuario encontrado:', {
        id: userWithPassword.id,
        email: userWithPassword.email,
        hasPassword: !!userWithPassword.password_hash
      });

      // Verificar si la contraseña almacenada es un hash bcrypt válido
      const isStoredPasswordHash = userWithPassword.password_hash.startsWith('$2a$') || 
                                   userWithPassword.password_hash.startsWith('$2b$');

      let isValidPassword = false;

      if (isStoredPasswordHash) {
        // Comparar usando bcrypt
        console.log('AuthService.login - Verificando hash bcrypt');
        isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
      } else {
        // Comparar en texto plano (para migración)
        console.log('AuthService.login - Verificando texto plano y migrando');
        isValidPassword = password === userWithPassword.password_hash;
        
        // Migrar a bcrypt si es válido
        if (isValidPassword) {
          const newHash = await bcrypt.hash(password, 10);
          await UserService.updateUserPassword(userWithPassword.id, newHash);
          console.log('AuthService.login - Password migrada a bcrypt');
        }
      }

      if (!isValidPassword) {
        console.log('AuthService.login - Contraseña inválida');
        throw new Error('Credenciales inválidas');
      }

      console.log('AuthService.login - Login exitoso');

      // Crear objeto user sin el hash de contraseña
      const { password_hash: _, ...userWithoutPassword } = userWithPassword;

      // Generar tokens
      const tokens = this.generateTokens({
        userId: userWithPassword.id,
        email: userWithPassword.email,
        username: userWithPassword.username
      });

      return {
        user: userWithoutPassword,
        tokens
      };
      
    } catch (error) {
      console.error('Error en login (AuthService):', error);
      throw error;
    }
  }

  // Buscar usuario por email
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserService.getUserByEmail(email);
      return user || null;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      throw new Error('Error al buscar usuario por email');
    }
  }

  // Buscar usuario por username   
  static async findUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await UserService.getUserByUsername(username);
      return user || null;
    } catch (error) {
      console.error('Error buscando usuario por username:', error);
      throw new Error('Error al buscar usuario por username');
    }
  }

  // Generar tokens de acceso y refresh
  static generateTokens(payload: TokenPayload): AuthTokens {
    try {
      const accessToken = jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'crypto-exchange-api',
        audience: 'crypto-exchange-users'
      });

      const refreshToken = jwt.sign(
        { userId: payload.userId }, 
        this.REFRESH_SECRET, 
        {
          expiresIn: this.REFRESH_TOKEN_EXPIRY,
          issuer: 'crypto-exchange-api',
          audience: 'crypto-exchange-users'
        }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60 // 15 minutos en segundos
      };
    } catch (error) {
      console.error('Error generando tokens:', error);
      throw new Error('Error al generar tokens de autenticación');
    }
  }

  // Verificar token de acceso
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'crypto-exchange-api',
        audience: 'crypto-exchange-users'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de acceso expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de acceso inválido');
      } else {
        throw new Error('Error verificando token de acceso');
      }
    }
  }

  // Verificar token de refresh
  static verifyRefreshToken(token: string): { userId: number } {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET, {
        issuer: 'crypto-exchange-api',
        audience: 'crypto-exchange-users'
      }) as { userId: number };

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de refresh expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de refresh inválido');
      } else {
        throw new Error('Error verificando token de refresh');
      }
    }
  }

  // Refrescar token de acceso
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verificar refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Obtener usuario actualizado
      const user = await UserService.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Generar nuevos tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      return tokens;
    } catch (error) {
      console.error('Error refrescando token:', error);
      throw error;
    }
  }

  // Generar token para verificación de email
  static generateEmailVerificationToken(userId: number, email: string): string {
    try {
      const payload = {
        userId,
        email,
        type: 'email_verification',
        timestamp: Date.now()
      };

      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'crypto-exchange-api'
      });
    } catch (error) {
      console.error('Error generando token de verificación:', error);
      throw new Error('Error al generar token de verificación');
    }
  }

  // Verificar token de verificación de email
  static verifyEmailVerificationToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'crypto-exchange-api'
      }) as any;

      if (decoded.type !== 'email_verification') {
        throw new Error('Tipo de token inválido');
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de verificación expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de verificación inválido');
      } else {
        throw error;
      }
    }
  }

  // Generar token para reset de contraseña
  static generatePasswordResetToken(userId: number, email: string): string {
    try {
      const payload = {
        userId,
        email,
        type: 'password_reset',
        timestamp: Date.now()
      };

      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: '1h',
        issuer: 'crypto-exchange-api'
      });
    } catch (error) {
      console.error('Error generando token de reset:', error);
      throw new Error('Error al generar token de reset');
    }
  }

  // Verificar token de reset de contraseña
  static verifyPasswordResetToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'crypto-exchange-api'
      }) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error('Tipo de token inválido');
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de reset expirado');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de reset inválido');
      } else {
        throw error;
      }
    }
  }

  // Generar código de verificación temporal
  static generateVerificationCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  // Generar hash para códigos de verificación
  static hashVerificationCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  // Verificar código de verificación
  static verifyVerificationCode(code: string, hashedCode: string): boolean {
    const hashedInput = this.hashVerificationCode(code);
    return hashedInput === hashedCode;
  }

  // Validar formato de token
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT tiene 3 partes separadas por puntos
    const parts = token.split('.');
    return parts.length === 3;
  }

  // Extraer información del token sin verificar (útil para debugging)
  static decodeTokenWithoutVerification(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  // Verificar si el token está cerca de expirar (útil para refresh automático)
  static isTokenNearExpiry(token: string, thresholdMinutes: number = 5): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      const threshold = thresholdMinutes * 60;
      
      return (decoded.exp - now) < threshold;
    } catch (error) {
      return true;
    }
  }
}