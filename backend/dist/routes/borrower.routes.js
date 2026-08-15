"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const borrower_controller_1 = require("../controllers/borrower.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/student/:studentId', borrower_controller_1.getBorrowerByStudentId);
router.get('/', auth_1.authenticateAdmin, borrower_controller_1.getAllBorrowers);
router.put('/:id', auth_1.authenticateAdmin, borrower_controller_1.updateBorrower);
router.delete('/:id', auth_1.authenticateAdmin, borrower_controller_1.deleteBorrower);
exports.default = router;
