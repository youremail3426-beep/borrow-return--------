import { Request, Response } from 'express';
import prisma from '../prisma';
import cloudinary from '../services/cloudinary';
import { sendReturnReceipt, sendBorrowConfirmation } from '../services/email.service';
import { AuthRequest } from '../middleware/auth';

const getStartOfTodayLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return new Date(d.toISOString().split('T')[0]);
};

// Admin: Borrow
export const borrowItems = async (req: Request, res: Response) => {
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

        // Find existing Borrower to check suspension
        const existingBorrower = await prisma.borrower.findUnique({
            where: { studentId: studentId || borrowerEmail }
        });

        if (existingBorrower && existingBorrower.isSuspended) {
            const now = new Date();
            if (!existingBorrower.suspendedUntil || existingBorrower.suspendedUntil > now) {
                return res.status(400).json({ 
                    error: `ผู้ใช้นี้ถูกระงับสิทธิ์: ${existingBorrower.suspensionReason || ''}`,
                    isSuspended: true,
                    suspendedUntil: existingBorrower.suspendedUntil
                });
            }
        }

        // Check for Overdue Items
        // Find any active transaction for this user that is overdue
        const overdueTransactions = await prisma.borrowTransaction.findFirst({
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
        const borrower = await prisma.borrower.upsert({
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
        const transaction = await prisma.borrowTransaction.create({
            data: {
                borrowerId: borrower.id,
                borrowDate: start,
                dueDate: end,
                adminId: (req as AuthRequest).user.id,
                conditionImageUrl: conditionImageUrl || null,
                notes: notes || null,
                items: {
                    create: equipmentIds.map((id: string) => ({ equipmentId: id }))
                }
            }
        });

        // Update Equipment Status -> BORROWED
        await prisma.equipment.updateMany({
            where: { id: { in: equipmentIds } },
            data: { status: 'BORROWED' }
        });

        // Fetch equipment names for email
        const equipmentList = await prisma.equipment.findMany({
            where: { id: { in: equipmentIds } },
            select: { name: true, serialNumber: true }
        });

        const itemNames = equipmentList.map(e => `${e.name} (${e.serialNumber})`);
        const formattedDueDate = new Date(dueDate).toLocaleDateString('th-TH');

        // Send Email
        await sendBorrowConfirmation(borrowerEmail, borrowerName, itemNames, formattedDueDate, transaction.id);

        res.json(transaction);
    } catch (error: any) {
        console.error("Borrow Error:", error);
        res.status(500).json({
            error: error.message || 'Borrow failed',
            details: error
        });
    }
};

// Admin: Return
export const returnItems = async (req: Request, res: Response) => {
    try {
        const { serialNumbers } = req.body; // Array of serials to return

        if (!serialNumbers || serialNumbers.length === 0) {
            return res.status(400).json({ error: 'No serial numbers provided' });
        }

        // 1. Find Equipments
        const equipments = await prisma.equipment.findMany({
            where: { serialNumber: { in: serialNumbers } }
        });
        const equipmentIds = equipments.map(e => e.id);

        if (equipmentIds.length === 0) {
            return res.status(404).json({ error: 'No equipment found with provided serial numbers' });
        }

        // 2. Find Active Borrow Items (BEFORE Update) to get User Info
        const activeBorrowItems = await prisma.borrowItem.findMany({
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
        await prisma.equipment.updateMany({
            where: { id: { in: equipmentIds } },
            data: { status: 'AVAILABLE' }
        });

        // 4. Update BorrowItems -> returnedAt = now
        const now = new Date();
        await prisma.borrowItem.updateMany({
            where: { id: { in: activeBorrowItems.map(i => i.id) } },
            data: { returnedAt: now }
        });

        // 5. Update Transactions (if fully returned)
        const transactionIds = [...new Set(activeBorrowItems.map(i => i.transactionId))];
        for (const txId of transactionIds) {
            const remaining = await prisma.borrowItem.count({
                where: { transactionId: txId, returnedAt: null }
            });
            if (remaining === 0) {
                // Fetch to clear image if exists
                const txToUpdate = await prisma.borrowTransaction.findUnique({ where: { id: txId } });
                if (txToUpdate?.conditionImageUrl) {
                    try {
                        const parts = txToUpdate.conditionImageUrl.split('/borrow-return-conditions/');
                        if (parts.length > 1) {
                            const filename = parts[1].split('.')[0];
                            const publicId = `borrow-return-conditions/${filename}`;
                            await cloudinary.uploader.destroy(publicId);
                        }
                    } catch (e) { console.error('Cloudinary destroy error:', e); }
                }

                await prisma.borrowTransaction.update({
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
        const returnMap = new Map<string, { name: string, items: string[] }>();

        for (const item of activeBorrowItems) {
            const email = item.transaction.borrower.email;
            const name = item.transaction.borrower.name;
            const itemName = `${ item.equipment.name } (${ item.equipment.serialNumber })`;

            if (!returnMap.has(email)) {
                returnMap.set(email, { name, items: [] });
            }
            returnMap.get(email)!.items.push(itemName);
        }

        // Send email to each borrower and check auto un-suspend for OVERDUE
        for (const [email, data] of returnMap.entries()) {
            await sendReturnReceipt(email, data.name, data.items);
            console.log(`Return receipt sent to ${email}`);

            // Auto un-suspend if they were suspended for OVERDUE and have no remaining overdue items
            const borrower = await prisma.borrower.findFirst({ where: { email } });
            if (borrower && borrower.isSuspended && borrower.suspensionType === 'OVERDUE') {
                const remainingOverdue = await prisma.borrowTransaction.count({
                    where: {
                        borrowerId: borrower.id,
                        returnedDate: null,
                        dueDate: { lt: getStartOfTodayLocal() }
                    }
                });
                
                if (remainingOverdue === 0) {
                    await prisma.borrower.update({
                        where: { id: borrower.id },
                        data: {
                            isSuspended: false,
                            suspensionType: null,
                            suspendedUntil: null,
                            suspensionReason: null
                        }
                    });
                    console.log(`Auto un-suspended ${email} (All overdue items returned)`);
                }
            }
        }

        res.json({ message: 'Returned successfully', returnedCount: activeBorrowItems.length });

    } catch (error) {
        console.error("Return Error:", error);
        res.status(500).json({ error: 'Return failed' });
    }
};


// Get All Transactions
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.borrowTransaction.findMany({
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
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
}

// Admin: Delete Transaction
export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if transaction exists
        const transaction = await prisma.borrowTransaction.findUnique({
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
            await prisma.equipment.updateMany({
                where: { id: { in: activeItems.map(i => i.equipmentId) } },
                data: { status: 'AVAILABLE' }
            });
        }

        await prisma.borrowTransaction.delete({
            where: { id }
        });

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Delete failed' });
    }
};

// Admin: Bulk Delete Transactions
export const deleteTransactions = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body; // Array of strings

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        // 1. Revert status for any active items in these transactions
        // Find all active borrow items belonging to these transactions
        const activeItems = await prisma.borrowItem.findMany({
            where: {
                transactionId: { in: ids },
                returnedAt: null
            }
        });

        if (activeItems.length > 0) {
            const equipmentIds = activeItems.map(i => i.equipmentId);
            await prisma.equipment.updateMany({
                where: { id: { in: equipmentIds } },
                data: { status: 'AVAILABLE' }
            });
        }

        // 2. Delete Transactions
        await prisma.borrowTransaction.deleteMany({
            where: { id: { in: ids } }
        });

        res.json({ message: 'Transactions deleted successfully' });
    } catch (error) {
        console.error("Bulk Delete Error:", error);
        res.status(500).json({ error: 'Bulk delete failed' });
    }
};

// Admin: Get Dashboard Stats
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalEquipment = await prisma.equipment.count();
        const availableEquipment = await prisma.equipment.count({ where: { status: 'AVAILABLE' } });
        const reservedEquipment = await prisma.equipment.count({ where: { status: 'RESERVED' } });
        const borrowedEquipment = await prisma.equipment.count({ where: { status: 'BORROWED' } });

        const pendingReservations = await prisma.reservation.count({ where: { status: 'PENDING' } });

        const activeBorrows = await prisma.borrowTransaction.count({ where: { returnedDate: null } });

        // Overdue Calculation (simple check if dueDate < now and not returned)
        const overdueItems = await prisma.borrowTransaction.count({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
// Active Borrows (Grouped by User)
export const getActiveBorrows = async (req: Request, res: Response) => {
    try {
        // Fetch all active borrow items (not returned)
        const activeItems = await prisma.borrowItem.findMany({
            where: { returnedAt: null },
            include: {
                equipment: true,
                transaction: { include: { borrower: true } }
            },
            orderBy: { transaction: { borrowDate: 'desc' } }
        });

        // Group by Borrower Email AND Name
        const grouped: any = {};

        for (const item of activeItems) {
            const email = item.transaction.borrower.email;
            const name = item.transaction.borrower.name;
            const key = `${ email } -${ name } `; // Composite key

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
    } catch (error) {
        console.error("Get Active Borrows Error:", error);
        res.status(500).json({ error: 'Failed to fetch active borrows' });
    }
};

// Admin: Get Single Transaction Details
export const getTransactionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.borrowTransaction.findUnique({
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
    } catch (error) {
        console.error("Get Transaction Error:", error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
};

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'borrow-return-conditions'
        });
        res.json({ imageUrl: result.secure_url });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

// Admin: Update Transaction Notes & Image
export const updateTransactionNotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { conditionImageUrl, notes } = req.body;

        const transaction = await prisma.borrowTransaction.update({
            where: { id },
            data: { conditionImageUrl, notes }
        });

        res.json(transaction);
    } catch (error) {
        console.error("Update Notes Error:", error);
        res.status(500).json({ error: 'Failed to update transaction notes' });
    }
};
