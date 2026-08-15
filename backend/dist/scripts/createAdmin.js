"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin4321@gmail.com';
    const password = 'smofte';
    const name = 'Super Admin';
    // Hash password
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await prisma.admin.upsert({
        where: { email },
        update: {
            password: hashedPassword, // Update password if exists
        },
        create: {
            email,
            password: hashedPassword,
            name,
        },
    });
    console.log(`Admin user created/updated: ${user.email}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
