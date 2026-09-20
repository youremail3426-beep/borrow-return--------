import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getAllAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Error fetching announcements' });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { title, content, isActive } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const newAnnouncement = await prisma.announcement.create({
            data: {
                title,
                content,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        res.status(201).json(newAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Error creating announcement' });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.announcement.delete({
            where: { id },
        });

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Error deleting announcement' });
    }
};
