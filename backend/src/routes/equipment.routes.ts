import { Router } from 'express';
import { getEquipments, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipment.controller';
import { authenticateAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getEquipments);
router.get('/:id', getEquipmentById);

router.post('/', authenticateAdmin, upload.single('image'), createEquipment);
router.put('/:id', authenticateAdmin, upload.single('image'), updateEquipment);
router.delete('/:id', authenticateAdmin, deleteEquipment);

export default router;
