"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialAdmin = exports.login = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await prisma_1.default.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isValid = await bcrypt_1.default.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email, role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, admin: { id: admin.id, email: admin.email } });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.login = login;
// Optional: Initial seed via API (Should be disabled in production or specific secret)
const createInitialAdmin = async (req, res) => {
    try {
        const { email, password, secret } = req.body;
        if (secret !== process.env.JWT_SECRET)
            return res.status(403).json({ message: "Forbidden" });
        const hashed = await bcrypt_1.default.hash(password, 10);
        const admin = await prisma_1.default.admin.create({
            data: { email, password: hashed }
        });
        res.json(admin);
    }
    catch (error) {
        res.status(500).json({ error });
    }
};
exports.createInitialAdmin = createInitialAdmin;
