"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
async function testActiveApi() {
    const admin = { id: 'dd54ce5c-4a4e-4217-8e95-485cc6168653', email: 'admin4321@gmail.com', role: 'ADMIN' };
    const token = jsonwebtoken_1.default.sign(admin, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log(`Generated token for admin: ${admin.email}`);
    try {
        const res = await axios_1.default.get('http://localhost:8000/api/borrow/active', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("API Status:", res.status);
        console.log("Data count:", res.data.length);
        console.log(JSON.stringify(res.data, null, 2));
    }
    catch (error) {
        console.error("API Error:", error.response?.status, error.response?.data || error.message);
    }
}
testActiveApi();
