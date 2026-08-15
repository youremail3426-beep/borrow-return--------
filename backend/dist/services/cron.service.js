"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDueDates = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const email_service_1 = require("./email.service");
const calculateOverdueWorkingDays = (startDate, endDate) => {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    curDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0);
    // เริ่มนับวันถัดจากวันครบกำหนด
    curDate.setDate(curDate.getDate() + 1);
    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        // 0 = Sunday, 6 = Saturday (ไม่นับเสาร์-อาทิตย์)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};
const checkDueDates = async () => {
    console.log('Running Due Date Check...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));
    try {
        const transactions = await prisma_1.default.borrowTransaction.findMany({
            where: {
                dueDate: {
                    gte: startOfTomorrow,
                    lte: endOfTomorrow,
                },
            },
            include: {
                borrower: true,
                items: {
                    include: { equipment: true },
                    where: { returnedAt: null } // Only unreturned items
                }
            }
        });
        for (const transaction of transactions) {
            if (transaction.items.length > 0) {
                const itemNames = transaction.items.map(i => i.equipment.name);
                await (0, email_service_1.sendDueDateReminder)(transaction.borrower.email, transaction.borrower.name, itemNames, transaction.dueDate.toLocaleDateString('th-TH'));
                console.log(`Sent reminder to ${transaction.borrower.email}`);
            }
        }
        console.log('Running Overdue Check...');
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const overdueTransactions = await prisma_1.default.borrowTransaction.findMany({
            where: {
                dueDate: {
                    lt: startOfToday,
                },
            },
            include: {
                borrower: true,
                items: {
                    include: { equipment: true },
                    where: { returnedAt: null } // Only unreturned items
                }
            }
        });
        for (const transaction of overdueTransactions) {
            if (transaction.items.length > 0) {
                const itemNames = transaction.items.map(i => i.equipment.name);
                // Calculate fine: 20 thb per item per working day (excluding weekends)
                const now = new Date();
                const daysOverdue = calculateOverdueWorkingDays(transaction.dueDate, now);
                const fineAmount = transaction.items.length * daysOverdue * 20;
                // If daysOverdue is 0 (e.g., due Friday, now it's Saturday), we might still want to warn them without incrementing the fine.
                // Or maybe fineAmount is 0 in weekend.
                await (0, email_service_1.sendOverdueWarning)(transaction.borrower.email, transaction.borrower.name, itemNames, transaction.dueDate.toLocaleDateString('th-TH'), fineAmount);
                console.log(`Sent overdue warning to ${transaction.borrower.email}`);
            }
        }
    }
    catch (error) {
        console.error('Error checking due dates or sending emails:', error);
    }
};
exports.checkDueDates = checkDueDates;
