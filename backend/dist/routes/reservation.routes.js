"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', reservation_controller_1.createReservation);
router.get('/borrower/search', reservation_controller_1.searchBorrowerInfo);
router.get('/', auth_1.authenticateAdmin, reservation_controller_1.getReservations);
router.put('/:id/status', auth_1.authenticateAdmin, reservation_controller_1.updateReservationStatus);
router.post('/:id/pickup', auth_1.authenticateAdmin, reservation_controller_1.confirmPickup);
router.post('/delete', auth_1.authenticateAdmin, reservation_controller_1.deleteReservations); // Bulk Delete
router.delete('/:id', auth_1.authenticateAdmin, reservation_controller_1.deleteReservation);
exports.default = router;
