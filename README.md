# SMO FTE Borrow & Return System

ระบบยืม-คืนอุปกรณ์ออนไลน์สำหรับ SMO FTE พัฒนาด้วย Node.js (Express) และ React (Vite)

## Features

- **Public User**:
  - ค้นหาอุปกรณ์ (Search)
  - ดูสถานะอุปกรณ์ (ว่าง, ถูกจอง, ถูกยืม)
  - เลือกอุปกรณ์หลายชิ้นและทำการจอง (Cart/Reservation)
- **Admin**:
  - Dashboard ภาพรวม (รออนุมัติ, กำลังถูกยืม, เกินกำหนด)
  - จัดการอุปกรณ์ (CRUD, Upload Image)
  - จัดการการจอง (อนุมัติ/ปฏิเสธ)
  - บันทึกการยืมและคืน (Borrow/Return)
  - ระบบแจ้งเตือนทางอีเมล (Email Notifications)

## Tech Stack

- **Backend**: Node.js, Express, Prisma, PostgreSQL (Supabase), Nodemailer, Cloudinary
- **Frontend**: React (Vite), Tailwind CSS, Lucide React, Axios

## Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- Cloudinary Account
- Gmail Account (App Password)

## Installation

### 1. Clone & Setup Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ `backend`:
```env
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-secret-key"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
EMAIL_USER="youremail@gmail.com"
EMAIL_PASS="your-app-password"
FRONTEND_URL="http://localhost:5173"
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

## วิธีการรันโปรแกรมตามที่ใช้งานจริง

เมื่อเริ่มใช้งานโปรแกรม:

1. เปิดหน้าต่าง PowerShell ขึ้นมา 2 อัน (ด้านล่างขวา) 
   *หมายเหตุ: ถ้าไม่ขึ้น ให้ไปที่แท็บด้านบนซ้าย เลือก Terminal > New Terminal ทำ 2 ครั้ง*

2. คลิก PowerShell อันที่ 1 (ด้านบนสุด) คัดลอกข้อความนี้หรือพิมพ์ `cd backend` ลงไปแล้วกด Enter
   - จากนั้น คัดลอกหรือพิมพ์ `npm run dev` ลงไปแล้วกด Enter

3. คลิก PowerShell อันที่ 2 (ต่อจากอันแรก) คัดลอกข้อความนี้หรือพิมพ์ `cd frontend` ลงไปแล้วกด Enter
   - จากนั้น คัดลอกหรือพิมพ์ `npm run dev` ลงไปแล้วกด Enter

4. เมื่อรันแล้ว ช่องทางเข้าคือ http://localhost:5173/ (กด Ctrl ในแป้นพิมพ์ค้างไว้ แล้วใช้เมาส์คลิกลิงก์) หรือเข้าผ่านไอคอนหน้าเดสก์ท็อปที่เขียนว่า "ระบบยืมของ"

## Deployment

### Backend (Render)
1. Push code to GitHub.
2. Create new Web Service on Render.
3. Connect repository.
4. Set Build Command: `npm install && npx prisma generate`
5. Set Start Command: `npm start`
6. Add Environment Variables from `.env`.

### Frontend (Vercel)
1. Push code to GitHub.
2. Import project in Vercel.
3. Set Framework Preset: Vite.
4. Deploy.

## License
MIT
