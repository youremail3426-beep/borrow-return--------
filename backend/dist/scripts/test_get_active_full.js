"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function testGetActiveBorrowsFull() {
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
        const grouped = {};
        for (const item of activeItems) {
            const email = item.transaction.borrowerEmail;
            const name = item.transaction.borrowerName;
            const key = `${email}-${name}`; // Composite key
            if (!grouped[key]) {
                grouped[key] = {
                    borrowerName: name,
                    borrowerEmail: email,
                    yearLevel: item.transaction.yearLevel,
                    department: item.transaction.department,
                    faculty: item.transaction.faculty,
                    phoneNumber: item.transaction.phoneNumber,
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
                isOverdue: new Date() > new Date(item.transaction.dueDate)
            });
        }
        const result = Object.values(grouped);
        console.log(`Successfully grouped items into ${result.length} borrowers.`);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error("Error in getActiveBorrows logic:", error);
    }
}
testGetActiveBorrowsFull()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
