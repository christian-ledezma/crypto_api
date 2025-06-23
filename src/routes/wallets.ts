import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticateToken } from '../middlewares/auth';
import { validateWallet } from '../middlewares/validation';

const router = Router();
// GET /api/wallets - Obtener todas las wallets del usuario
router.get('/', authenticateToken, WalletController.getUserWallets);

// GET /api/wallets/crypto/:cryptoId/balance - Obtener balance de una crypto específica
router.get('/crypto/:cryptoId/balance', authenticateToken, WalletController.getBalanceByCrypto);

// POST /api/wallets - Crear nueva wallet
router.post('/', authenticateToken, validateWallet.create, WalletController.createWallet);

// PUT /api/wallets/:id/balance - Actualizar balance
router.put('/:id/balance', authenticateToken, validateWallet.updateBalance, WalletController.updateWalletBalance);

// POST /api/wallets/transfer - Transferir entre wallets
router.post('/transfer', authenticateToken, validateWallet.transfer, WalletController.transferBetweenWallets);

// DELETE /api/wallets/:id - Eliminar wallet
router.delete('/:id', authenticateToken, WalletController.deleteWallet);

export default router;