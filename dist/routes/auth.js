"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
router.post('/register', validation_1.validateAuth.register, authController_1.authController.register);
router.post('/login', validation_1.validateAuth.login, authController_1.authController.login);
router.post('/logout', authController_1.authController.logout);
router.post('/refresh', authController_1.authController.refreshToken);
router.post('/verify-email', authController_1.authController.verifyEmail);
router.post('/forgot-password', authController_1.authController.forgotPassword);
exports.default = router;
//# sourceMappingURL=auth.js.map