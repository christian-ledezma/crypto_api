import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';

// Extender la interfaz Request para incluir user
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Token de acceso requerido' });
    return; // Termina la ejecución sin llamar next()
  }

  if (!config.security.jwtSecret) {
    res.status(500).json({ error: 'Configuración de JWT no encontrada' });
    return; // Termina la ejecución sin llamar next()
  }

  jwt.verify(token, config.security.jwtSecret, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Token inválido o expirado' });
      return; // Termina la ejecución dentro del callback
    }

    req.user = decoded;
    next(); // Continúa al siguiente middleware
  });
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  if (!config.security.jwtSecret) {
    next();
    return;
  }

  jwt.verify(token, config.security.jwtSecret, (err: any, decoded: any) => {
    if (!err) {
      req.user = decoded;
    }
    next();
  });
};