import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReturn() {
    const serialNumbers = ['03']; // From our check_db.ts output: "ไพ่" (03) is BORROWED
    console.log(`Attempting to return serial numbers: ${serialNumbers}`);

    // 1. Find Equipments
    const equipments = await prisma.equipment.findMany({
        where: { serialNumber: { in: serialNumbers } }
    });
    const equipmentIds = equipments.map(e => e.id);
    console.log(`Found equipment IDs: ${equipmentIds}`);

    if (equipmentIds.length === 0) {
        console.log('No equipment found');
        return;
    }

    // 2. Find Active Borrow Items
    const activeBorrowItems = await prisma.borrowItem.findMany({
        where: {
            equipmentId: { in: equipmentIds },
            returnedAt: null
        },
        include: {
            equipment: true,
            transaction: true
        }
    });
    console.log(`Found ${activeBorrowItems.length} active borrow items`);

    // 3. Update Equipment Status -> AVAILABLE
    const updateEquip = await prisma.equipment.updateMany({
        where: { id: { in: equipmentIds } },
        data: { status: 'AVAILABLE' }
    });
    console.log(`Updated ${updateEquip.count} equipments to AVAILABLE`);

    // 4. Update BorrowItems -> returnedAt = now
    const now = new Date();
    const updateItems = await prisma.borrowItem.updateMany({
        where: { id: { in: activeBorrowItems.map(i => i.id) } },
        data: { returnedAt: now }
    });
    console.log(`Updated ${updateItems.count} borrow items with returnedAt`);

    // 5. Update Transactions
    const transactionIds = [...new Set(activeBorrowItems.map(i => i.transactionId))];
    for (const txId of transactionIds) {
        const remaining = await prisma.borrowItem.count({
            where: { transactionId: txId, returnedAt: null }
        });
        console.log(`Transaction ${txId} has ${remaining} remaining items`);
        if (remaining === 0) {
            await prisma.borrowTransaction.update({
                where: { id: txId },
                data: { returnedDate: now }
            });
            console.log(`Transaction ${txId} fully returned`);
        }
    }
}

testReturn()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
