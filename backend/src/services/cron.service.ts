import prisma from '../prisma';
import { sendDueDateReminder, sendOverdueWarning, sendSuspensionMissedPickup, sendSuspensionOverdue } from './email.service';

const calculateOverdueWorkingDays = (startDate: Date, endDate: Date): number => {
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

export const checkDueDates = async () => {
    console.log('Running Due Date Check & Suspensions...');
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    try {
        // 1. Clear expired suspensions
        const expiredSuspensions = await prisma.borrower.findMany({
            where: {
                isSuspended: true,
                suspendedUntil: { lt: now }
            }
        });
        
        if (expiredSuspensions.length > 0) {
            await prisma.borrower.updateMany({
                where: { id: { in: expiredSuspensions.map(b => b.id) } },
                data: { isSuspended: false, suspendedUntil: null, suspensionType: null, suspensionReason: null }
            });
            console.log(`Cleared ${expiredSuspensions.length} expired suspensions.`);
        }

        // 2. Check Missed Pickups (APPROVED reservations where borrowDate < today)
        const missedPickups = await prisma.reservation.findMany({
            where: {
                status: 'APPROVED',
                borrowDate: { lt: startOfToday }
            },
            include: { items: true, borrower: true }
        });

        for (const res of missedPickups) {
            // Cancel reservation
            await prisma.reservation.update({
                where: { id: res.id },
                data: { status: 'CANCELLED_MISSED' as any } // Needs schema support, or just REJECTED. Let's use REJECTED with note if we don't have enum.
            });

            // Release equipment
            const equipmentIds = res.items.map(i => i.equipmentId);
            await prisma.equipment.updateMany({
                where: { id: { in: equipmentIds } },
                data: { status: 'AVAILABLE' }
            });

            // Suspend borrower for 3 days
            const suspendedUntil = new Date(now);
            suspendedUntil.setDate(suspendedUntil.getDate() + 3);

            await prisma.borrower.update({
                where: { id: res.borrowerId },
                data: {
                    isSuspended: true,
                    suspensionType: 'MISSED_PICKUP',
                    suspendedUntil,
                    suspensionReason: 'ไม่มารับอุปกรณ์ตามกำหนดจอง'
                }
            });

            // Send email
            await sendSuspensionMissedPickup(
                res.borrower.email,
                res.borrower.name,
                suspendedUntil.toLocaleDateString('th-TH')
            );
            console.log(`Suspended ${res.borrower.email} for missed pickup.`);
        }
        const transactions = await prisma.borrowTransaction.findMany({
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
                await sendDueDateReminder(
                    transaction.borrower.email,
                    transaction.borrower.name,
                    itemNames,
                    transaction.dueDate.toLocaleDateString('th-TH')
                );
                console.log(`Sent reminder to ${transaction.borrower.email}`);
            }
        }

        console.log('Running Overdue Check...');

        const overdueTransactions = await prisma.borrowTransaction.findMany({
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


                await sendOverdueWarning(
                    transaction.borrower.email,
                    transaction.borrower.name,
                    itemNames,
                    transaction.dueDate.toLocaleDateString('th-TH'),
                    fineAmount
                );
                console.log(`Sent overdue warning to ${transaction.borrower.email}`);

                // Suspend borrower for OVERDUE if not already suspended for it
                if (!transaction.borrower.isSuspended || transaction.borrower.suspensionType !== 'OVERDUE') {
                    await prisma.borrower.update({
                        where: { id: transaction.borrowerId },
                        data: {
                            isSuspended: true,
                            suspensionType: 'OVERDUE',
                            suspendedUntil: null, // Indefinite until returned
                            suspensionReason: 'มียอดค้างส่งคืนอุปกรณ์'
                        }
                    });
                    
                    await sendSuspensionOverdue(
                        transaction.borrower.email,
                        transaction.borrower.name,
                        itemNames
                    );
                    console.log(`Suspended ${transaction.borrower.email} for overdue items.`);
                }
            }
        }
    } catch (error) {
        console.error('Error checking due dates or sending emails:', error);
    }
};
