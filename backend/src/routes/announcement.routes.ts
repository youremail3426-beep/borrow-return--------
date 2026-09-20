import express from 'express';
import { getAllAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', getAllAnnouncements);
router.post('/', authenticateAdmin, createAnnouncement);
router.delete('/:id', authenticateAdmin, deleteAnnouncement);

export default router;
