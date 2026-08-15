import { Request, Response } from 'express';
import prisma from '../prisma';
import cloudinary from '../services/cloudinary';

// Public: Get all equipments with search
export const getEquipments = async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { serialNumber: { contains: String(search) } },
            ];
        }
        if (status) {
            where.status = status;
        }

        // Add filtering by IDs (comma separated)
        if (req.query.ids) {
            const idList = String(req.query.ids).split(',');
            where.id = { in: idList };
        }

        const equipments = await prisma.equipment.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(equipments);
    } catch (error: any) {
        console.error("Get Equipments Error:", error);
        res.status(500).json({ error: 'Failed to fetch equipments', details: error.message });
    }
};

// Public: Get single
export const getEquipmentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const equipment = await prisma.equipment.findUnique({ where: { id } });
        if (!equipment) return res.status(404).json({ error: 'Not found' });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching equipment' });
    }
}

// Admin: Create
export const createEquipment = async (req: Request, res: Response) => {
    try {
        const { name, serialNumber } = req.body;
        let imageUrl = '';

        if (req.file) {
            // Direct upload to Cloudinary using buffer
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'borrow-return-equipments'
            });
            imageUrl = result.secure_url;
        }

        const equipment = await prisma.equipment.create({
            data: {
                name,
                serialNumber,
                imageUrl,
                status: 'AVAILABLE'
            }
        });
        res.json(equipment);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Serial number already exists.' });
        }
        res.status(500).json({
            error: 'Failed to create equipment.',
            details: error.message || error
        });
    }
};

// Admin: Update
export const updateEquipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, serialNumber, status } = req.body;

        let updateData: any = { name, serialNumber, status };

        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'borrow-return-equipments'
            });
            updateData.imageUrl = result.secure_url;
        }

        const equipment = await prisma.equipment.update({
            where: { id },
            data: updateData
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
};

// Admin: Delete
export const deleteEquipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Transaction to delete related records first (Application-Level Cascade Delete)
        await prisma.$transaction(async (tx) => {
            // 1. Delete BorrowItems
            await tx.borrowItem.deleteMany({
                where: { equipmentId: id }
            });

            // 2. Delete ReservationItems
            await tx.reservationItem.deleteMany({
                where: { equipmentId: id }
            });

            // 3. Delete Equipment
            await tx.equipment.delete({
                where: { id }
            });
        });

        res.json({ message: 'Equipment and related data deleted successfully' });
    } catch (error: any) {
        console.error("Delete Error details:", error);
        res.status(500).json({
            error: `Delete failed: ${error.message || 'Unknown error'}`,
            details: error
        });
    }
};
