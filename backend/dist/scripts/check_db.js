"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("--- Equipment Status ---");
    const equipment = await prisma.equipment.findMany({
        select: { id: true, name: true, serialNumber: true, status: true }
    });
    console.table(equipment);
    console.log("\n--- Active Borrow Items (returnedAt: null) ---");
    const activeItems = await prisma.borrowItem.findMany({
        where: { returnedAt: null },
        include: {
            equipment: { select: { name: true, serialNumber: true } },
            transaction: { select: { borrowerName: true, borrowerEmail: true } }
        }
    });
    console.log(JSON.stringify(activeItems, null, 2));
    console.log("\n--- Active Transactions (returnedDate: null) ---");
    const activeTransactions = await prisma.borrowTransaction.findMany({
        where: { returnedDate: null },
        include: {
            items: {
                include: { equipment: { select: { name: true, serialNumber: true } } }
            }
        }
    });
    console.log(JSON.stringify(activeTransactions, null, 2));
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
