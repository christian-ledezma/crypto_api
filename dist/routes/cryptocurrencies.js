"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cryptoController_1 = require("../controllers/cryptoController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', cryptoController_1.CryptoController.getAllCryptocurrencies);
router.get('/active', cryptoController_1.CryptoController.getActiveCryptocurrencies);
router.get('/:id', cryptoController_1.CryptoController.getCryptocurrencyById);
router.get('/:symbol/price', cryptoController_1.CryptoController.getCurrentPrice);
router.post('/', auth_1.authenticateToken, cryptoController_1.CryptoController.createCryptocurrency);
router.put('/:id', auth_1.authenticateToken, cryptoController_1.CryptoController.updateCryptocurrency);
router.delete('/:id', auth_1.authenticateToken, cryptoController_1.CryptoController.deactivateCryptocurrency);
exports.default = router;
//# sourceMappingURL=cryptocurrencies.js.map