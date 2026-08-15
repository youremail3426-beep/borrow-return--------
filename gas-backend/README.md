# Google Apps Script Backend

โฟลเดอร์นี้ประกอบด้วยซอร์สโค้ดสำหรับนำไปรันบน Google Apps Script เพื่อใช้แทนที่ Node.js Backend เดิม

## วิธีการนำไปใช้งาน

1. **สร้าง Google Sheet**
   - สร้างไฟล์ Google Sheet ใหม่บน Google Drive
   - สร้างแผ่นงาน (Sheets) ย่อยด้านล่าง ดังนี้:
     - `Admins` (คอลัมน์: id, email, password, name, createdAt, updatedAt)
     - `Borrowers` (คอลัมน์: id, studentId, name, email, ...)
     - `Equipments` (คอลัมน์: id, name, serialNumber, imageUrl, status, createdAt, updatedAt)
     - `BorrowTransactions` (คอลัมน์: id, borrowerId, borrowDate, dueDate, adminId, notes, createdAt, updatedAt)
     - `BorrowItems` (คอลัมน์: id, transactionId, equipmentId, returnedAt, createdAt, updatedAt)
     - `Reservations` และ `ReservationItems`
   - คัดลอก ID ของ Google Sheet จาก URL (ตัวอักษรยาวๆ ระหว่าง `/d/` และ `/edit`)

2. **สร้าง Google Apps Script**
   - ไปที่ `ส่วนขยาย (Extensions) > Apps Script` ในเมนูของ Google Sheets
   - คัดลอกโค้ดจากไฟล์ `.js` ในโฟลเดอร์นี้ ไปวางเป็นไฟล์ `.gs` ใน Apps Script ทีละไฟล์
   - ในไฟล์ `Code.gs` ให้เปลี่ยนค่า `SPREADSHEET_ID` เป็น ID ของชีตที่ก๊อปปี้มา

3. **Deploy Web App**
   - กดปุ่ม **Deploy (การทำให้ใช้งานได้)** มุมขวาบน > **New Deployment (การทำให้ใช้งานได้รายการใหม่)**
   - เลือกประเภทเป็น **Web app (เว็บแอป)**
   - ตั้งค่าสิทธิ์การเข้าถึงเป็น **Anyone (ทุกคน)** 
   - กด Deploy แล้วนำ URL ที่ได้ (ลงท้ายด้วย `/exec`) ไปตั้งค่าใน Frontend

4. **ตั้งค่าฝั่ง Frontend**
   - นำ URL ที่ได้จากข้อ 3 ไปวางในไฟล์ `frontend/.env` ตรงตัวแปร `VITE_API_URL`
