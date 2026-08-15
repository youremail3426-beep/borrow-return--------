import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import equipmentRoutes from './routes/equipment.routes';
import reservationRoutes from './routes/reservation.routes';
import borrowRoutes from './routes/borrow.routes';
import { checkDueDates } from './services/cron.service';
import { getTransactionById } from './controllers/borrow.controller';
import { getReservationById } from './controllers/reservation.controller';
import borrowerRoutes from './routes/borrower.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/borrowers', borrowerRoutes);

// Public Email Links
app.get('/api/public/borrow/:id', getTransactionById);
app.get('/api/public/reservation/:id', getReservationById);

// Health Check
app.get('/', (req, res) => {
    res.send('Borrow & Return System API is running');
});

// Cron Trigger (Can be called externally)
app.get('/api/cron/check-due', async (req, res) => {
    await checkDueDates();
    res.send('Checked');
});

// Start Server
app.listen(Number(PORT), () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Backend accessible at http://172.16.12.9:${PORT}`);

    // Initial check on startup
    checkDueDates();

    // Simple interval check (every 24 hours) - Note: Might reset on free tier spin-down
    setInterval(checkDueDates, 24 * 60 * 60 * 1000);
});
