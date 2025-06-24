"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const databaseService_1 = require("./services/databaseService");
const errorHandler_1 = require("./middlewares/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000');
app.use((0, helmet_1.default)());
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('combined'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Demasiadas peticiones desde esta IP, intenta más tarde.'
    }
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
    }
    catch (error) {
        console.error(`❌ Error al cargar ruta ${route.path}:`, error);
        process.exit(1);
    }
});
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV || 'development'
    });
});
app.use((req, res, _next) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.method} ${req.path} no existe`,
        availableRoutes: routes.map(r => r.path)
    });
});
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        await databaseService_1.db.execute('SELECT 1');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log('📌 Rutas disponibles:');
            routes.forEach(route => console.log(`   - ${route.path}`));
            console.log(`   - /api/health`);
        });
    }
    catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map