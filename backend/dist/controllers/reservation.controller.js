"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservationById = exports.deleteReservations = exports.deleteReservation = exports.confirmPickup = exports.updateReservationStatus = exports.getReservations = exports.searchBorrowerInfo = exports.createReservation = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const email_service_1 = require("../services/email.service");
const getStartOfTodayLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return new Date(d.toISOString().split('T')[0]);
};
// Public: Create Reservation
const createReservation = async (req, res) => {
    try {
        const { borrowerName, borrowerEmail, studentId, yearLevel, department, faculty, phoneNumber, borrowDate, returnDate, equipmentIds } = req.body;
        // Validate inputs
        if (!equipmentIds || equipmentIds.length === 0) {
            return res.status(400).json({ error: 'No equipment selected' });
        }
        // Check for overdue items (Active items that are overdue)
        const overdueCount = await prisma_1.default.borrowItem.count({
            where: {
                returnedAt: null, // Still borrowing
                transaction: {
                    borrower: { email: borrowerEmail },
                    dueDate: { lt: getStartOfTodayLocal() } // Due date is passed
                }
            }
        });
        if (overdueCount > 0) {
            return res.status(400).json({
                error: 'คุณมีรายการอุปกรณ์ที่เกินกำหนดคืน กรุณาคืนอุปกรณ์ก่อนทำการจองใหม่',
                overdueCount: overdueCount
            });
        }
        // Check availability
        const unavailableItems = await prisma_1.default.equipment.findMany({
            where: {
                id: { in: equipmentIds },
                status: { not: 'AVAILABLE' }
            }
        });
        if (unavailableItems.length > 0) {
            return res.status(400).json({
                error: 'Some items are not available',
                unavailable: unavailableItems.map(i => i.name)
            });
        }
        // Find or Create Borrower
        const borrower = await prisma_1.default.borrower.upsert({
            where: { studentId: studentId || borrowerEmail },
            update: { name: borrowerName, email: borrowerEmail, yearLevel, department, faculty, phoneNumber },
            create: { studentId: studentId || borrowerEmail, name: borrowerName, email: borrowerEmail, yearLevel, department, faculty, phoneNumber }
        });
        // Create Reservation
        const reservation = await prisma_1.default.reservation.create({
            data: {
                borrowerId: borrower.id,
                borrowDate: new Date(borrowDate),
                returnDate: new Date(returnDate),
                status: 'PENDING',
                items: {
                    create: equipmentIds.map((id) => ({ equipmentId: id }))
                }
            },
            include: { items: { include: { equipment: true } }, borrower: true }
        });
        // Send Email
        await (0, email_service_1.sendReservationPending)(borrowerEmail, borrowerName);
        await (0, email_service_1.sendAdminNewReservationNotification)(borrowerName, equipmentIds.length, new Date(borrowDate).toLocaleDateString('th-TH'), new Date(returnDate).toLocaleDateString('th-TH'));
        res.json(reservation);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
};
exports.createReservation = createReservation;
// Public: Search Borrower Info by Email, Name, or Student ID
const searchBorrowerInfo = async (req, res) => {
    try {
        const { email, name, studentId } = req.query;
        if (!email && !name && !studentId) {
            return res.status(400).json({ error: 'Email, name, or student ID is required' });
        }
        const conditions = [];
        if (email && typeof email === 'string')
            conditions.push({ email });
        if (name && typeof name === 'string')
            conditions.push({ name });
        if (studentId && typeof studentId === 'string')
            conditions.push({ studentId });
        // Find Borrower directly
        const borrower = await prisma_1.default.borrower.findFirst({
            where: { OR: conditions },
            select: {
                name: true,
                email: true,
                studentId: true,
                yearLevel: true,
                department: true,
                faculty: true,
                phoneNumber: true,
                createdAt: true
            }
        });
        if (!borrower) {
            return res.status(404).json({ message: 'No returning borrower found' });
        }
        const result = {
            borrowerName: borrower.name,
            borrowerEmail: borrower.email,
            studentId: borrower.studentId,
            yearLevel: borrower.yearLevel,
            department: borrower.department,
            faculty: borrower.faculty,
            phoneNumber: borrower.phoneNumber,
            createdAt: borrower.createdAt
        };
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching borrower info:', error);
        res.status(500).json({ error: 'Failed to fetch borrower info' });
    }
};
exports.searchBorrowerInfo = searchBorrowerInfo;
// Admin: Get All
const getReservations = async (req, res) => {
    try {
        const reservations = await prisma_1.default.reservation.findMany({
            include: { items: { include: { equipment: true } }, borrower: true },
            orderBy: { createdAt: 'desc' }
        });
        const formatted = reservations.map(r => ({
            ...r,
            borrowerName: r.borrower?.name,
            borrowerEmail: r.borrower?.email,
            studentId: r.borrower?.studentId,
            yearLevel: r.borrower?.yearLevel,
            department: r.borrower?.department,
            faculty: r.borrower?.faculty,
            phoneNumber: r.borrower?.phoneNumber,
        }));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getReservations = getReservations;
// Admin: Approve/Reject
const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // APPROVED or REJECTED
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id },
            include: { items: true, borrower: true }
        });
        if (!reservation)
            return res.status(404).json({ error: 'Not found' });
        if (status === 'APPROVED') {
            // Check availability again before approving
            const equipmentIds = reservation.items.map(i => i.equipmentId);
            const unavailable = await prisma_1.default.equipment.count({
                where: {
                    id: { in: equipmentIds },
                    status: { not: 'AVAILABLE' }
                }
            });
            if (unavailable > 0) {
                return res.status(400).json({ error: 'Some items are no longer available' });
            }
            // Update status and equipment status
            await prisma_1.default.$transaction([
                prisma_1.default.reservation.update({ where: { id }, data: { status: 'APPROVED' } }),
                prisma_1.default.equipment.updateMany({
                    where: { id: { in: equipmentIds } },
                    data: { status: 'RESERVED' }
                })
            ]);
        }
        else if (status === 'REJECTED') {
            await prisma_1.default.reservation.update({ where: { id }, data: { status: 'REJECTED' } });
            // Ensure equipment is available (if it was reserved? logic usually keeps it available until approved)
            // If we were reserving on create, we would release here. But we reserve on Approve.
            // If previously approved, we need to release.
            if (reservation.status === 'APPROVED') {
                const equipmentIds = reservation.items.map(i => i.equipmentId);
                await prisma_1.default.equipment.updateMany({
                    where: { id: { in: equipmentIds } },
                    data: { status: 'AVAILABLE' }
                });
            }
        }
        // Send Email
        await (0, email_service_1.sendReservationStatus)(reservation.borrower.email, reservation.borrower.name, status, reservation.id);
        res.json({ message: `Reservation ${status}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
};
exports.updateReservationStatus = updateReservationStatus;
// Admin: Confirm Pickup (Convert to Borrow)
const confirmPickup = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user?.id; // Must be authenticated
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized: Admin ID missing' });
        }
        console.log(`Confirming pickup for Reservation: ${id} by Admin: ${adminId}`);
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id },
            include: { items: { include: { equipment: true } }, borrower: true }
        });
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        if (reservation.status !== 'APPROVED') {
            return res.status(400).json({ error: 'Reservation must be APPROVED to confirm pickup' });
        }
        // Transaction
        const newTransaction = await prisma_1.default.$transaction(async (tx) => {
            // 1. Create Borrow Record
            const transaction = await tx.borrowTransaction.create({
                data: {
                    borrowerId: reservation.borrowerId,
                    borrowDate: new Date(), // Pickup Date = Now
                    dueDate: reservation.returnDate,
                    adminId: adminId,
                    items: {
                        create: reservation.items.map(i => ({ equipmentId: i.equipmentId }))
                    }
                }
            });
            console.log("Created BorrowTransaction:", transaction.id);
            // 2. Update Equipment Status -> BORROWED
            await tx.equipment.updateMany({
                where: { id: { in: reservation.items.map(i => i.equipmentId) } },
                data: { status: 'BORROWED' }
            });
            // 3. Update Reservation Status -> COMPLETED
            await tx.reservation.update({
                where: { id },
                data: { status: 'COMPLETED' } // Cast for safety if enum logic differs
            });
            return transaction;
        });
        // Send Email
        const itemNames = reservation.items.map((i) => `${i.equipment.name} (${i.equipment.serialNumber})`);
        const formattedDueDate = new Date(reservation.returnDate).toLocaleDateString('th-TH');
        await (0, email_service_1.sendBorrowConfirmation)(reservation.borrower.email, reservation.borrower.name, itemNames, formattedDueDate, newTransaction.id);
        res.json({ message: 'Pickup confirmed and Borrow Transaction created' });
    }
    catch (error) {
        console.error("Pickup Error:", error);
        res.status(500).json({ error: 'Pickup confirmation failed', details: error.message });
    }
};
exports.confirmPickup = confirmPickup;
// Admin: Delete Reservation
const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        // If Approved, we must release equipment back to AVAILABLE
        if (reservation.status === 'APPROVED') {
            const equipmentIds = reservation.items.map(i => i.equipmentId);
            await prisma_1.default.equipment.updateMany({
                where: { id: { in: equipmentIds } },
                data: { status: 'AVAILABLE' }
            });
        }
        await prisma_1.default.reservation.delete({
            where: { id }
        });
        res.json({ message: 'Reservation deleted successfully' });
    }
    catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
};
exports.deleteReservation = deleteReservation;
// Admin: Bulk Delete Reservations
const deleteReservations = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }
        // Find reservations to be deleted to check for APPROVED ones
        const reservationsToDelete = await prisma_1.default.reservation.findMany({
            where: { id: { in: ids } },
            include: { items: true }
        });
        // Collect equipment IDs to revert from APPROVED reservations
        const equipmentToRevert = [];
        reservationsToDelete.forEach(res => {
            if (res.status === 'APPROVED') {
                res.items.forEach(item => equipmentToRevert.push(item.equipmentId));
            }
        });
        // Revert equipment status
        if (equipmentToRevert.length > 0) {
            await prisma_1.default.equipment.updateMany({
                where: { id: { in: equipmentToRevert } },
                data: { status: 'AVAILABLE' }
            });
        }
        // Delete reservations
        await prisma_1.default.reservation.deleteMany({
            where: { id: { in: ids } }
        });
        res.json({ message: 'Reservations deleted successfully' });
    }
    catch (error) {
        console.error("Bulk Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete reservations' });
    }
};
exports.deleteReservations = deleteReservations;
// Public: Get Single Reservation Details
const getReservationById = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id },
            include: {
                items: { include: { equipment: true } },
                borrower: true
            }
        });
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        const formatted = {
            ...reservation,
            borrowerName: reservation.borrower?.name,
            borrowerEmail: reservation.borrower?.email,
            studentId: reservation.borrower?.studentId,
            yearLevel: reservation.borrower?.yearLevel,
            department: reservation.borrower?.department,
            faculty: reservation.borrower?.faculty,
            phoneNumber: reservation.borrower?.phoneNumber,
        };
        res.json(formatted);
    }
    catch (error) {
        console.error("Get Reservation Error:", error);
        res.status(500).json({ error: 'Failed to fetch reservation' });
    }
};
exports.getReservationById = getReservationById;
