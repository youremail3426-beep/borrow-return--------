import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin4321@gmail.com';
    const password = 'smofte';
    const name = 'Super Admin';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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
