import { Router } from 'express';
import { login, createInitialAdmin } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/setup-admin', createInitialAdmin); // Use cautiously

export default router;
