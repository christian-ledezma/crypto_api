"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const router = (0, express_1.Router)();
router.get('/', healthController_1.HealthController.checkHealth);
router.post('/clear-cache', healthController_1.HealthController.clearCache);
router.get('/symbols', healthController_1.HealthController.getAvailableSymbols);
exports.default = router;
//# sourceMappingURL=health.js.map