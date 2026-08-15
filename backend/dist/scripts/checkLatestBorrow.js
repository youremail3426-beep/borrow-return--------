"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const tx = await prisma.borrowTransaction.findFirst({
            orderBy: { createdAt: 'desc' },
            select: {
                borrowerEmail: true,
                borrowerName: true,
                dueDate: true,
                createdAt: true
            }
        });
        if (tx) {
            console.log("Latest Transaction Found:");
            console.log(`Email: ${tx.borrowerEmail}`);
            console.log(`Name: ${tx.borrowerName}`);
            console.log(`Due Date: ${tx.dueDate}`);
            console.log(`Created At: ${tx.createdAt}`);
        }
        else {
            console.log("No transactions found.");
        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
