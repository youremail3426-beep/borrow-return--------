"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const borrow_controller_1 = require("../controllers/borrow.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateAdmin);
router.get('/', borrow_controller_1.getTransactions);
router.post('/borrow', borrow_controller_1.borrowItems);
router.post('/return', borrow_controller_1.returnItems);
router.post('/delete', borrow_controller_1.deleteTransactions); // Bulk Delete
router.get('/stats', borrow_controller_1.getDashboardStats);
// Active Borrows for Return Search
router.get('/active', borrow_controller_1.getActiveBorrows);
router.get('/:id', borrow_controller_1.getTransactionById);
router.delete('/:id', borrow_controller_1.deleteTransaction);
exports.default = router;
