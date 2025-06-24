"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cryptoController_1 = require("../controllers/cryptoController");
const router = (0, express_1.Router)();
router.get('/', cryptoController_1.CryptoController.getAllCryptocurrencies);
router.get('/:id', cryptoController_1.CryptoController.getCryptocurrencyById);
router.get('/:symbol/price', cryptoController_1.CryptoController.getCurrentPrice);
exports.default = router;
//# sourceMappingURL=cryptocurrencies.js.map