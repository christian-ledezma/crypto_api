"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
router.post('/register', validation_1.registerValidation, userController_1.userController.createUser);
router.get('/profile', auth_1.authenticateToken, userController_1.userController.getProfile);
router.put('/profile', auth_1.authenticateToken, validation_1.updateUserValidation, userController_1.userController.updateProfile);
router.get('/:id', auth_1.authenticateToken, userController_1.userController.getUserById);
router.delete('/account', auth_1.authenticateToken, userController_1.userController.deleteAccount);
router.put('/change-password', auth_1.authenticateToken, validation_1.updateUserValidation, userController_1.userController.changePassword);
exports.default = router;
//# sourceMappingURL=users.js.map