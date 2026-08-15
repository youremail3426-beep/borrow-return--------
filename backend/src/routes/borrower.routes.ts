import express from 'express';
import { getBorrowerByStudentId, getAllBorrowers, updateBorrower, deleteBorrower } from '../controllers/borrower.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/student/:studentId', getBorrowerByStudentId);
router.get('/', authenticateAdmin, getAllBorrowers);
router.put('/:id', authenticateAdmin, updateBorrower);
router.delete('/:id', authenticateAdmin, deleteBorrower);

export default router;
