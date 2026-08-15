import { Router } from 'express';
import { createReservation, getReservations, updateReservationStatus, confirmPickup, deleteReservation, deleteReservations, searchBorrowerInfo } from '../controllers/reservation.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

router.post('/', createReservation);
router.get('/borrower/search', searchBorrowerInfo);
router.get('/', authenticateAdmin, getReservations);
router.put('/:id/status', authenticateAdmin, updateReservationStatus);
router.post('/:id/pickup', authenticateAdmin, confirmPickup);
router.post('/delete', authenticateAdmin, deleteReservations); // Bulk Delete
router.delete('/:id', authenticateAdmin, deleteReservation);

export default router;
