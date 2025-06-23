import { Router } from 'express';
import { CryptoController } from '../controllers/cryptoController';

const router = Router();

// GET /api/cryptocurrencies - Obtener todas las criptomonedas disponibles
router.get('/', CryptoController.getAllCryptocurrencies);

// GET /api/cryptocurrencies/:id - Obtener criptomoneda específica
router.get('/:id', CryptoController.getCryptocurrencyById);

// GET /api/cryptocurrencies/:symbol/price - Obtener precio actual
router.get('/:symbol/price', CryptoController.getCurrentPrice);

export default router;