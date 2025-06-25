import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './services/databaseService';
import { errorHandler } from './middlewares/errorHandler';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000');

// Middleware de seguridad
app.use(helmet());

// CONFIGURACIÓN CORS CORREGIDA
const corsOrigins = process.env.CORS_ORIGINS;
let allowedOrigins: string[] = [];

if (corsOrigins) {
  allowedOrigins = corsOrigins.split(',').map(o => o.trim()).filter(o => o.length > 0);
} else {
  // Orígenes por defecto para desarrollo
  allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000'
  ];
}

console.log('🌐 Orígenes CORS permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como Postman, aplicaciones móviles)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Origen no permitido por CORS: ${origin}`);
      console.log('✅ Orígenes permitidos:', allowedOrigins);
      callback(new Error(`Origen ${origin} no permitido por CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Importante: manejar preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging mejorado
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta más tarde.'
  }
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para debugging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'No origin'}`);
  next();
});

// Importar y registrar rutas
const routes = [
  { path: '/api/auth', module: './routes/auth' },
  { path: '/api/users', module: './routes/users' },
  { path: '/api/wallets', module: './routes/wallets' },
  { path: '/api/exchanges', module: './routes/exchanges' },
  { path: '/api/cryptocurrencies', module: './routes/cryptocurrencies' },
  { path: '/api/health', module: './routes/health' }
];

routes.forEach(route => {
  try {
    const router = require(route.module).default;
    app.use(route.path, router);
  } catch (error) {
    console.error(`❌ Error al cargar ruta ${route.path}:`, error);
    process.exit(1);
  }
});

// Ruta de health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: allowedOrigins
  });
});

// Manejar rutas no encontradas
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.path} no existe`,
    availableRoutes: routes.map(r => r.path)
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const startServer = async (): Promise<void> => {
  try {
    await db.execute('SELECT 1');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('🌐 CORS configurado para:', allowedOrigins);
      console.log('📌 Rutas disponibles:');
      routes.forEach(route => console.log(` - ${route.path}`));
      console.log(` - /api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;