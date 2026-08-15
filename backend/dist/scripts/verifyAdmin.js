"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.admin.findUnique({
        where: { email: 'admin4321@gmail.com' },
    });
    console.log('Verification Result:', user);
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
