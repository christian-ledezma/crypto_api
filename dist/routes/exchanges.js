"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exchangeController_1 = require("../controllers/exchangeController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, exchangeController_1.ExchangeController.getUserExchanges);
router.get('/sent', auth_1.authenticateToken, exchangeController_1.ExchangeController.getSentExchanges);
router.get('/received', auth_1.authenticateToken, exchangeController_1.ExchangeController.getReceivedExchanges);
router.get('/:id', auth_1.authenticateToken, exchangeController_1.ExchangeController.getExchangeById);
router.post('/', auth_1.authenticateToken, validation_1.exchangeValidation.create, exchangeController_1.ExchangeController.createExchange);
router.put('/:id/status', auth_1.authenticateToken, validation_1.exchangeValidation.updateStatus, exchangeController_1.ExchangeController.updateStatus);
router.post('/:id/accept', auth_1.authenticateToken, exchangeController_1.ExchangeController.acceptExchange);
router.post('/:id/reject', auth_1.authenticateToken, exchangeController_1.ExchangeController.rejectExchange);
exports.default = router;
//# sourceMappingURL=exchanges.js.map