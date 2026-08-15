import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: 'ADMIN' },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({ token, admin: { id: admin.id, email: admin.email } });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Optional: Initial seed via API (Should be disabled in production or specific secret)
export const createInitialAdmin = async (req: Request, res: Response) => {
    try {
        const { email, password, secret } = req.body;
        if (secret !== process.env.JWT_SECRET) return res.status(403).json({ message: "Forbidden" });

        const hashed = await bcrypt.hash(password, 10);
        const admin = await prisma.admin.create({
            data: { email, password: hashed }
        });
        res.json(admin);
    } catch (error) {
        res.status(500).json({ error });
    }
}
