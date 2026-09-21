const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const stats = await prisma.equipment.groupBy({
        by: ['status'],
        _count: { status: true }
    });
    console.log(stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
