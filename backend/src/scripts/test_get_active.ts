import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGetActiveBorrows() {
    try {
        console.log("Testing getActiveBorrows logic...");
        const activeItems = await prisma.borrowItem.findMany({
            where: { returnedAt: null },
            include: {
                equipment: true,
                transaction: true
            },
            orderBy: { transaction: { borrowDate: 'desc' } }
        });
        console.log(`Successfully fetched ${activeItems.length} active items.`);
    } catch (error) {
        console.error("Error in getActiveBorrows logic:", error);
    }
}

testGetActiveBorrows()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
