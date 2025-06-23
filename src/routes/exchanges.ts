import { Router } from 'express';
import { ExchangeController } from '../controllers/exchangeController';
import { authenticateToken } from '../middlewares/auth';
import { exchangeValidation } from '../middlewares/validation';

const router = Router();

// GET /api/exchanges - Obtener historial de intercambios del usuario
router.get('/', authenticateToken, ExchangeController.getUserExchanges);

// GET /api/exchanges/sent - Intercambios enviados por el usuario
router.get('/sent', authenticateToken, ExchangeController.getSentExchanges);

// GET /api/exchanges/received - Intercambios recibidos por el usuario
router.get('/received', authenticateToken, ExchangeController.getReceivedExchanges);

// GET /api/exchanges/:id - Obtener intercambio específico
router.get('/:id', authenticateToken, ExchangeController.getExchangeById);

// POST /api/exchanges - Crear nuevo intercambio
router.post('/', authenticateToken, exchangeValidation.create, ExchangeController.createExchange);

// PUT /api/exchanges/:id/status - Actualizar estado del intercambio
router.put('/:id/status', authenticateToken, exchangeValidation.updateStatus, ExchangeController.updateStatus);

// POST /api/exchanges/:id/accept - Aceptar intercambio
router.post('/:id/accept', authenticateToken, ExchangeController.acceptExchange);

// POST /api/exchanges/:id/reject - Rechazar intercambio
router.post('/:id/reject', authenticateToken, ExchangeController.rejectExchange);

export default router;