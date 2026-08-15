"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const equipment_routes_1 = __importDefault(require("./routes/equipment.routes"));
const reservation_routes_1 = __importDefault(require("./routes/reservation.routes"));
const borrow_routes_1 = __importDefault(require("./routes/borrow.routes"));
const cron_service_1 = require("./services/cron.service");
const borrow_controller_1 = require("./controllers/borrow.controller");
const reservation_controller_1 = require("./controllers/reservation.controller");
const borrower_routes_1 = __importDefault(require("./routes/borrower.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/equipments', equipment_routes_1.default);
app.use('/api/reservations', reservation_routes_1.default);
app.use('/api/borrow', borrow_routes_1.default);
app.use('/api/borrowers', borrower_routes_1.default);
// Public Email Links
app.get('/api/public/borrow/:id', borrow_controller_1.getTransactionById);
app.get('/api/public/reservation/:id', reservation_controller_1.getReservationById);
// Health Check
app.get('/', (req, res) => {
    res.send('Borrow & Return System API is running');
});
// Cron Trigger (Can be called externally)
app.get('/api/cron/check-due', async (req, res) => {
    await (0, cron_service_1.checkDueDates)();
    res.send('Checked');
});
// Start Server
app.listen(Number(PORT), () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Backend accessible at http://172.16.12.9:${PORT}`);
    // Initial check on startup
    (0, cron_service_1.checkDueDates)();
    // Simple interval check (every 24 hours) - Note: Might reset on free tier spin-down
    setInterval(cron_service_1.checkDueDates, 24 * 60 * 60 * 1000);
});
