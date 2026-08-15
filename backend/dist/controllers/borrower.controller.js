"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBorrower = exports.updateBorrower = exports.getAllBorrowers = exports.getBorrowerByStudentId = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getBorrowerByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const borrower = await prisma_1.default.borrower.findUnique({
            where: { studentId }
        });
        if (!borrower) {
            return res.status(404).json({ error: 'Borrower not found' });
        }
        res.json(borrower);
    }
    catch (error) {
        console.error("Get Borrower Error:", error);
        res.status(500).json({ error: 'Failed to fetch borrower' });
    }
};
exports.getBorrowerByStudentId = getBorrowerByStudentId;
const getAllBorrowers = async (req, res) => {
    try {
        const borrowers = await prisma_1.default.borrower.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(borrowers);
    }
    catch (error) {
        console.error("Get Borrowers Error:", error);
        res.status(500).json({ error: 'Failed to fetch borrowers' });
    }
};
exports.getAllBorrowers = getAllBorrowers;
const updateBorrower = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const borrower = await prisma_1.default.borrower.update({
            where: { id },
            data
        });
        res.json(borrower);
    }
    catch (error) {
        console.error("Update Borrower Error:", error);
        res.status(500).json({ error: 'Failed to update borrower' });
    }
};
exports.updateBorrower = updateBorrower;
const deleteBorrower = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.borrower.delete({
            where: { id }
        });
        res.json({ message: 'Borrower deleted' });
    }
    catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete borrower' });
    }
};
exports.deleteBorrower = deleteBorrower;
