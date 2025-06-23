import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();

// GET /api/health - Estado general de la API
router.get('/', HealthController.checkHealth);

// POST /api/health/clear-cache - Limpiar caché
router.post('/clear-cache', HealthController.clearCache);

// GET /api/health/symbols - Listar símbolos disponibles
router.get('/symbols', HealthController.getAvailableSymbols);


export default router;