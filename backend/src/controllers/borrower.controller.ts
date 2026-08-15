import { Request, Response } from 'express';
import prisma from '../prisma';

export const getBorrowerByStudentId = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const borrower = await prisma.borrower.findUnique({
            where: { studentId }
        });
        if (!borrower) {
            return res.status(404).json({ error: 'Borrower not found' });
        }
        res.json(borrower);
    } catch (error) {
        console.error("Get Borrower Error:", error);
        res.status(500).json({ error: 'Failed to fetch borrower' });
    }
};

export const getAllBorrowers = async (req: Request, res: Response) => {
    try {
        const borrowers = await prisma.borrower.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(borrowers);
    } catch (error) {
        console.error("Get Borrowers Error:", error);
        res.status(500).json({ error: 'Failed to fetch borrowers' });
    }
};

export const updateBorrower = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const borrower = await prisma.borrower.update({
            where: { id },
            data
        });
        res.json(borrower);
    } catch (error) {
        console.error("Update Borrower Error:", error);
        res.status(500).json({ error: 'Failed to update borrower' });
    }
};

export const deleteBorrower = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.borrower.delete({
            where: { id }
        });
        res.json({ message: 'Borrower deleted' });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete borrower' });
    }
};
