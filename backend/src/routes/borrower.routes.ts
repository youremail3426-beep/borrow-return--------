import express from 'express';
import { getBorrowerByStudentId, getAllBorrowers, updateBorrower, deleteBorrower, suspendBorrower, unsuspendBorrower } from '../controllers/borrower.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/student/:studentId', getBorrowerByStudentId);
router.get('/', authenticateAdmin, getAllBorrowers);
router.put('/:id', authenticateAdmin, updateBorrower);
router.delete('/:id', authenticateAdmin, deleteBorrower);
router.post('/:id/suspend', authenticateAdmin, suspendBorrower);
router.post('/:id/unsuspend', authenticateAdmin, unsuspendBorrower);

export default router;
