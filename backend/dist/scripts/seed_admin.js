"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function seed() {
    try {
        const hashed = await bcrypt_1.default.hash('smofte', 10);
        await prisma.admin.upsert({
            where: { email: 'admin@admin.com' },
            update: { password: hashed },
            create: {
                email: 'admin@admin.com',
                password: hashed,
                name: 'Admin SMO'
            }
        });
        console.log('✅ Admin account seeded successfully.');
    }
    catch (e) {
        console.error('❌ Failed to seed admin:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
seed();
