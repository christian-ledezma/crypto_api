"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const walletController_1 = require("../controllers/walletController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, walletController_1.WalletController.getUserWallets);
router.get('/crypto/:cryptoId/balance', auth_1.authenticateToken, walletController_1.WalletController.getBalanceByCrypto);
router.post('/', auth_1.authenticateToken, validation_1.validateWallet.create, walletController_1.WalletController.createWallet);
router.put('/:id/balance', auth_1.authenticateToken, validation_1.validateWallet.updateBalance, walletController_1.WalletController.updateWalletBalance);
router.post('/transfer', auth_1.authenticateToken, validation_1.validateWallet.transfer, walletController_1.WalletController.transferBetweenWallets);
router.delete('/:id', auth_1.authenticateToken, walletController_1.WalletController.deleteWallet);
exports.default = router;
//# sourceMappingURL=wallets.js.map