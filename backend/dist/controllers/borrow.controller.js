"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.getTransactionById = exports.getActiveBorrows = exports.getDashboardStats = exports.deleteTransactions = exports.deleteTransaction = exports.getTransactions = exports.returnItems = exports.borrowItems = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const cloudinary_1 = __importDefault(require("../services/cloudinary"));
const email_service_1 = require("../services/email.service");
const getStartOfTodayLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return new Date(d.toISOString().split('T')[0]);
};
// Admin: Borrow
const borrowItems = async (req, res) => {
    try {
        const { borrowerName, borrowerEmail, studentId, yearLevel, department, faculty, phoneNumber, borrowDate, dueDate, equipmentIds, conditionImageUrl, notes } = req.body;
        // Validate Items (must be AVAILABLE or RESERVED)
        // Actually, if reserved, it should be reserved for THIS user. But for simplicity, Admin overrides.
        // Validate Duration (Max 3 Days)
        const start = new Date(borrowDate);
        const end = new Date(dueDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 3) {
            return res.status(400).json({ error: 'ยืมได้สูงสุดไม่เกิน 3 วัน' });
        }
        // Check for Overdue Items
        // Find any active transaction for this user that is overdue
        const overdueTransactions = await prisma_1.default.borrowTransaction.findFirst({
            where: {
                borrower: { email: borrowerEmail },
                returnedDate: null,
                dueDate: {
                    lt: getStartOfTodayLocal() // Due date is strictly before today
                }
            }
        });
        if (overdueTransactions) {
            return res.status(400).json({ error: 'ไม่สามารถยืมได้ เนื่องจากคุณมีรายการอุปกรณ์ที่เกินกำหนดคืน (Overdue)' });
        }
        // Find or Create Borrower
        const borrower = await prisma_1.default.borrower.upsert({
            where: { studentId: studentId || borrowerEmail }, // Fallback to email if studentId is missing (or enforce studentId)
            update: {
                name: borrowerName,
                email: borrowerEmail,
                yearLevel,
                department,
                faculty,
                phoneNumber
            },
            create: {
                studentId: studentId || borrowerEmail,
                name: borrowerName,
                email: borrowerEmail,
                yearLevel,
                department,
                faculty,
                phoneNumber
            }
        });
        // Create Transaction
        const transaction = await prisma_1.default.borrowTransaction.create({
            data: {
                borrowerId: borrower.id,
                borrowDate: start,
                dueDate: end,
                adminId: req.user.id,
                conditionImageUrl: conditionImageUrl || null,
                notes: notes || null,
                items: {
                    create: equipmentIds.map((id) => ({ equipmentId: id }))
                }
            }
        });
        // Update Equipment Status -> BORROWED
        await prisma_1.default.equipment.updateMany({
            where: { id: { in: equipmentIds } },
            data: { status: 'BORROWED' }
        });
        // Fetch equipment names for email
        const equipmentList = await prisma_1.default.equipment.findMany({
            where: { id: { in: equipmentIds } },
            select: { name: true, serialNumber: true }
        });
        const itemNames = equipmentList.map(e => `${e.name} (${e.serialNumber})`);
        const formattedDueDate = new Date(dueDate).toLocaleDateString('th-TH');
        // Send Email
        await (0, email_service_1.sendBorrowConfirmation)(borrowerEmail, borrowerName, itemNames, formattedDueDate, transaction.id);
        res.json(transaction);
    }
    catch (error) {
        console.error("Borrow Error:", error);
        res.status(500).json({
            error: error.message || 'Borrow failed',
            details: error
        });
    }
};
exports.borrowItems = borrowItems;
// Admin: Return
const returnItems = async (req, res) => {
    try {
        const { serialNumbers } = req.body; // Array of serials to return
        if (!serialNumbers || serialNumbers.length === 0) {
            return res.status(400).json({ error: 'No serial numbers provided' });
        }
        // 1. Find Equipments
        const equipments = await prisma_1.default.equipment.findMany({
            where: { serialNumber: { in: serialNumbers } }
        });
        const equipmentIds = equipments.map(e => e.id);
        if (equipmentIds.length === 0) {
            return res.status(404).json({ error: 'No equipment found with provided serial numbers' });
        }
        // 2. Find Active Borrow Items (BEFORE Update) to get User Info
        const activeBorrowItems = await prisma_1.default.borrowItem.findMany({
            where: {
                equipmentId: { in: equipmentIds },
                returnedAt: null
            },
            include: {
                equipment: true,
                transaction: { include: { borrower: true } } // Get borrower info
            }
        });
        // 3. Update Equipment Status -> AVAILABLE
        await prisma_1.default.equipment.updateMany({
            where: { id: { in: equipmentIds } },
            data: { status: 'AVAILABLE' }
        });
        // 4. Update BorrowItems -> returnedAt = now
        const now = new Date();
        await prisma_1.default.borrowItem.updateMany({
            where: { id: { in: activeBorrowItems.map(i => i.id) } },
            data: { returnedAt: now }
        });
        // 5. Update Transactions (if fully returned)
        const transactionIds = [...new Set(activeBorrowItems.map(i => i.transactionId))];
        for (const txId of transactionIds) {
            const remaining = await prisma_1.default.borrowItem.count({
                where: { transactionId: txId, returnedAt: null }
            });
            if (remaining === 0) {
                // Fetch to clear image if exists
                const txToUpdate = await prisma_1.default.borrowTransaction.findUnique({ where: { id: txId } });
                if (txToUpdate?.conditionImageUrl) {
                    try {
                        const parts = txToUpdate.conditionImageUrl.split('/borrow-return-conditions/');
                        if (parts.length > 1) {
                            const filename = parts[1].split('.')[0];
                            const publicId = `borrow-return-conditions/${filename}`;
                            await cloudinary_1.default.uploader.destroy(publicId);
                        }
                    }
                    catch (e) {
                        console.error('Cloudinary destroy error:', e);
                    }
                }
                await prisma_1.default.borrowTransaction.update({
                    where: { id: txId },
                    data: {
                        returnedDate: now,
                        conditionImageUrl: null,
                        notes: null
                    }
                });
            }
        }
        // 6. Send Emails (Group by Borrower)
        const returnMap = new Map();
        for (const item of activeBorrowItems) {
            const email = item.transaction.borrower.email;
            const name = item.transaction.borrower.name;
            const itemName = `${item.equipment.name} (${item.equipment.serialNumber})`;
            if (!returnMap.has(email)) {
                returnMap.set(email, { name, items: [] });
            }
            returnMap.get(email).items.push(itemName);
        }
        // Send email to each borrower
        for (const [email, data] of returnMap.entries()) {
            await (0, email_service_1.sendReturnReceipt)(email, data.name, data.items);
            console.log(`Return receipt sent to ${email}`);
        }
        res.json({ message: 'Returned successfully', returnedCount: activeBorrowItems.length });
    }
    catch (error) {
        console.error("Return Error:", error);
        res.status(500).json({ error: 'Return failed' });
    }
};
exports.returnItems = returnItems;
// Get All Transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await prisma_1.default.borrowTransaction.findMany({
            include: { items: { include: { equipment: true } }, admin: true, borrower: true },
            orderBy: { createdAt: 'desc' }
        });
        const formatted = transactions.map(t => ({
            ...t,
            borrowerName: t.borrower?.name,
            borrowerEmail: t.borrower?.email,
            studentId: t.borrower?.studentId,
            yearLevel: t.borrower?.yearLevel,
            department: t.borrower?.department,
            faculty: t.borrower?.faculty,
            phoneNumber: t.borrower?.phoneNumber,
        }));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getTransactions = getTransactions;
// Admin: Delete Transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if transaction exists
        const transaction = await prisma_1.default.borrowTransaction.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        // Check if items are currently borrowed (returnedDate is null)
        // If we delete an active transaction, we should set the equipment status back to AVAILABLE
        // or prevent deletion? User asked to "delete history", usually implies cleanup.
        // Let's safe-guard: If deleting active transaction, revert equipment to AVAILABLE.
        const activeItems = transaction.items.filter(item => !item.returnedAt);
        if (activeItems.length > 0) {
            await prisma_1.default.equipment.updateMany({
                where: { id: { in: activeItems.map(i => i.equipmentId) } },
                data: { status: 'AVAILABLE' }
            });
        }
        await prisma_1.default.borrowTransaction.delete({
            where: { id }
        });
        res.json({ message: 'Transaction deleted successfully' });
    }
    catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Delete failed' });
    }
};
exports.deleteTransaction = deleteTransaction;
// Admin: Bulk Delete Transactions
const deleteTransactions = async (req, res) => {
    try {
        const { ids } = req.body; // Array of strings
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }
        // 1. Revert status for any active items in these transactions
        // Find all active borrow items belonging to these transactions
        const activeItems = await prisma_1.default.borrowItem.findMany({
            where: {
                transactionId: { in: ids },
                returnedAt: null
            }
        });
        if (activeItems.length > 0) {
            const equipmentIds = activeItems.map(i => i.equipmentId);
            await prisma_1.default.equipment.updateMany({
                where: { id: { in: equipmentIds } },
                data: { status: 'AVAILABLE' }
            });
        }
        // 2. Delete Transactions
        await prisma_1.default.borrowTransaction.deleteMany({
            where: { id: { in: ids } }
        });
        res.json({ message: 'Transactions deleted successfully' });
    }
    catch (error) {
        console.error("Bulk Delete Error:", error);
        res.status(500).json({ error: 'Bulk delete failed' });
    }
};
exports.deleteTransactions = deleteTransactions;
// Admin: Get Dashboard Stats
const getDashboardStats = async (req, res) => {
    try {
        const totalEquipment = await prisma_1.default.equipment.count();
        const availableEquipment = await prisma_1.default.equipment.count({ where: { status: 'AVAILABLE' } });
        const reservedEquipment = await prisma_1.default.equipment.count({ where: { status: 'RESERVED' } });
        const borrowedEquipment = await prisma_1.default.equipment.count({ where: { status: 'BORROWED' } });
        const pendingReservations = await prisma_1.default.reservation.count({ where: { status: 'PENDING' } });
        const activeBorrows = await prisma_1.default.borrowTransaction.count({ where: { returnedDate: null } });
        // Overdue Calculation (simple check if dueDate < now and not returned)
        const overdueItems = await prisma_1.default.borrowTransaction.count({
            where: {
                returnedDate: null,
                dueDate: { lt: getStartOfTodayLocal() }
            }
        });
        res.json({
            totalEquipment,
            availableEquipment,
            reservedEquipment,
            borrowedEquipment,
            pendingReservations,
            activeBorrows,
            overdueItems
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
// Active Borrows (Grouped by User)
const getActiveBorrows = async (req, res) => {
    try {
        // Fetch all active borrow items (not returned)
        const activeItems = await prisma_1.default.borrowItem.findMany({
            where: { returnedAt: null },
            include: {
                equipment: true,
                transaction: { include: { borrower: true } }
            },
            orderBy: { transaction: { borrowDate: 'desc' } }
        });
        // Group by Borrower Email AND Name
        const grouped = {};
        for (const item of activeItems) {
            const email = item.transaction.borrower.email;
            const name = item.transaction.borrower.name;
            const key = `${email}-${name}`; // Composite key
            if (!grouped[key]) {
                grouped[key] = {
                    borrowerName: name,
                    borrowerEmail: email,
                    studentId: item.transaction.borrower.studentId,
                    yearLevel: item.transaction.borrower.yearLevel,
                    department: item.transaction.borrower.department,
                    faculty: item.transaction.borrower.faculty,
                    phoneNumber: item.transaction.borrower.phoneNumber,
                    items: []
                };
            }
            grouped[key].items.push({
                itemId: item.id,
                equipmentId: item.equipment.id,
                equipmentName: item.equipment.name,
                serialNumber: item.equipment.serialNumber,
                imageUrl: item.equipment.imageUrl,
                borrowDate: item.transaction.borrowDate,
                dueDate: item.transaction.dueDate,
                conditionImageUrl: item.transaction.conditionImageUrl,
                transactionNotes: item.transaction.notes,
                isOverdue: getStartOfTodayLocal() > new Date(item.transaction.dueDate)
            });
        }
        // Convert object to array
        const result = Object.values(grouped);
        res.json(result);
    }
    catch (error) {
        console.error("Get Active Borrows Error:", error);
        res.status(500).json({ error: 'Failed to fetch active borrows' });
    }
};
exports.getActiveBorrows = getActiveBorrows;
// Admin: Get Single Transaction Details
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma_1.default.borrowTransaction.findUnique({
            where: { id },
            include: {
                items: { include: { equipment: true } },
                admin: true,
                borrower: true
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const formatted = {
            ...transaction,
            borrowerName: transaction.borrower?.name,
            borrowerEmail: transaction.borrower?.email,
            studentId: transaction.borrower?.studentId,
            yearLevel: transaction.borrower?.yearLevel,
            department: transaction.borrower?.department,
            faculty: transaction.borrower?.faculty,
            phoneNumber: transaction.borrower?.phoneNumber,
        };
        res.json(formatted);
    }
    catch (error) {
        console.error("Get Transaction Error:", error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
};
exports.getTransactionById = getTransactionById;
const uploadImage = async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No image uploaded' });
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary_1.default.uploader.upload(dataURI, {
            folder: 'borrow-return-conditions'
        });
        res.json({ imageUrl: result.secure_url });
    }
    catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};
exports.uploadImage = uploadImage;
