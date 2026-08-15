import { Router } from 'express';
import { borrowItems, returnItems, getTransactions, getDashboardStats, deleteTransaction, deleteTransactions, getActiveBorrows, getTransactionById, uploadImage, updateTransactionNotes } from '../controllers/borrow.controller';
import { authenticateAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticateAdmin);

router.get('/', getTransactions);
router.post('/borrow', borrowItems);
router.post('/return', returnItems);
router.post('/delete', deleteTransactions); // Bulk Delete
router.get('/stats', getDashboardStats);

// Active Borrows for Return Search
router.get('/active', getActiveBorrows);

router.post('/upload', upload.single('image'), uploadImage);
router.put('/:id/notes', updateTransactionNotes);

router.get('/:id', getTransactionById);
router.delete('/:id', deleteTransaction);

export default router;
