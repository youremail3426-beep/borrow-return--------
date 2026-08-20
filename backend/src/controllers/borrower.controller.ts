import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendSuspensionManual } from '../services/email.service';

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

export const suspendBorrower = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason, suspendedUntil } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการระงับสิทธิ์' });
        }

        const parsedUntil = suspendedUntil ? new Date(suspendedUntil) : null;

        const borrower = await prisma.borrower.update({
            where: { id },
            data: {
                isSuspended: true,
                suspensionType: 'MANUAL',
                suspensionReason: reason,
                suspendedUntil: parsedUntil
            }
        });

        const untilStr = parsedUntil ? parsedUntil.toLocaleDateString('th-TH') : 'จนกว่าจะดำเนินการแก้ไขสำเร็จ';
        await sendSuspensionManual(borrower.email, borrower.name, reason, untilStr);

        res.json({ message: 'ระงับสิทธิ์สำเร็จ', borrower });
    } catch (error) {
        console.error("Suspend Error:", error);
        res.status(500).json({ error: 'Failed to suspend borrower' });
    }
};

export const unsuspendBorrower = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const borrower = await prisma.borrower.update({
            where: { id },
            data: {
                isSuspended: false,
                suspensionType: null,
                suspensionReason: null,
                suspendedUntil: null
            }
        });

        res.json({ message: 'ปลดระงับสิทธิ์สำเร็จ', borrower });
    } catch (error) {
        console.error("Unsuspend Error:", error);
        res.status(500).json({ error: 'Failed to unsuspend borrower' });
    }
};
