import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
    try {
        const hashed = await bcrypt.hash('smofte', 10);
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
    } catch (e) {
        console.error('❌ Failed to seed admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
