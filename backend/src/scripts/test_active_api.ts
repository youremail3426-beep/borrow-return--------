import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testActiveApi() {
    const admin = { id: 'dd54ce5c-4a4e-4217-8e95-485cc6168653', email: 'admin4321@gmail.com', role: 'ADMIN' };
    const token = jwt.sign(
        admin,
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    console.log(`Generated token for admin: ${admin.email}`);
    
    try {
        const res = await axios.get('http://localhost:8000/api/borrow/active', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("API Status:", res.status);
        console.log("Data count:", res.data.length);
        console.log(JSON.stringify(res.data, null, 2));
    } catch (error: any) {
        console.error("API Error:", error.response?.status, error.response?.data || error.message);
    }
}

testActiveApi();
