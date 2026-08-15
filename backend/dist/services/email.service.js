"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNewReservationNotification = exports.sendBorrowConfirmation = exports.sendOverdueWarning = exports.sendDueDateReminder = exports.sendReturnReceipt = exports.sendReservationStatus = exports.sendReservationPending = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'youremail3426@gmail.com',
        pass: process.env.EMAIL_PASS || 'ccli rvgg myog jqjm',
    },
});
const logoPath = path_1.default.join(__dirname, '../assets/logo.png');
const sendEmail = async (to, subject, html) => {
    try {
        const hasLogo = fs_1.default.existsSync(logoPath);
        const logoHtml = hasLogo ? `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="cid:logo" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
            </div>` : '';
        const attachments = hasLogo ? [{
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo'
            }] : [];
        const info = await transporter.sendMail({
            from: `"Borrow & Return System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: `${logoHtml}${html}`,
            attachments
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
};
exports.sendEmail = sendEmail;
const sendReservationPending = async (to, name) => {
    const subject = 'การจองอุปกรณ์ของคุณอยู่ระหว่างการตรวจสอบ (Pending)';
    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>เราได้รับคำขอจองอุปกรณ์ของคุณแล้ว</p>
    <p>สถานะ: <strong>รอการตรวจสอบ (Pending)</strong></p>
    <p>เจ้าหน้าที่จะทำการตรวจสอบและแจ้งผลให้ทราบทางอีเมลนี้อีกครั้ง</p>
    <br>
    <p>ขอบคุณครับ</p>
  `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendReservationPending = sendReservationPending;
const sendReservationStatus = async (to, name, status, reservationId) => {
    const isApproved = status === 'APPROVED';
    const subject = isApproved ? 'การจองอนุมัติเรียบร้อยแล้ว (Approved)' : 'การจองถูกปฏิเสธ (Rejected)';
    const color = isApproved ? 'green' : 'red';
    const statusText = isApproved ? 'อนุมัติ' : 'ปฏิเสธ';
    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>ผลการจองอุปกรณ์ของคุณสรุปดังนี้:</p>
    <h2 style="color: ${color};">สถานะ: ${statusText}</h2>
    ${isApproved ? '<p>โปรดมารับอุปกรณ์ตามวันที่จองไว้</p>' : '<p>ขออภัยในความไม่สะดวก</p>'}
    <br>
    <p>ขอบคุณครับ</p>
  `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendReservationStatus = sendReservationStatus;
const groupItemsForEmail = (items) => {
    const parsed = items.map(item => {
        const match = item.match(/^(.*)\s\((.*?)\)$/);
        if (match) {
            return { name: match[1].trim(), serial: match[2].trim(), orig: item };
        }
        return { name: item, serial: '', orig: item };
    });
    const groups = {};
    const others = [];
    parsed.forEach(p => {
        if (!p.serial) {
            others.push(p.orig);
        }
        else {
            if (!groups[p.name])
                groups[p.name] = [];
            groups[p.name].push(p.serial);
        }
    });
    const formatSerialNumbers = (serials) => {
        if (!serials || serials.length === 0)
            return '';
        const uniqueSerials = Array.from(new Set(serials));
        if (uniqueSerials.length === 1)
            return uniqueSerials[0];
        const prefixGroups = {};
        const noPrefix = [];
        uniqueSerials.forEach((s) => {
            const match = s.match(/^(.*?[^\d])?(\d+)$/);
            if (match) {
                const prefix = match[1] || '';
                const numStr = match[2];
                if (!prefixGroups[prefix])
                    prefixGroups[prefix] = [];
                prefixGroups[prefix].push({ numStr, num: parseInt(numStr, 10) });
            }
            else {
                noPrefix.push(s);
            }
        });
        const resultParts = [];
        Object.keys(prefixGroups).forEach(prefix => {
            const items = prefixGroups[prefix];
            items.sort((a, b) => a.num - b.num);
            const chunks = [];
            let currentChunk = [];
            items.forEach(item => {
                if (currentChunk.length === 0) {
                    currentChunk.push(item);
                }
                else {
                    const prev = currentChunk[currentChunk.length - 1];
                    if (item.num === prev.num + 1) {
                        currentChunk.push(item);
                    }
                    else {
                        chunks.push(currentChunk);
                        currentChunk = [item];
                    }
                }
            });
            if (currentChunk.length > 0)
                chunks.push(currentChunk);
            const formattedChunks = chunks.map(chunk => {
                if (chunk.length === 1)
                    return chunk[0].numStr;
                return `${chunk[0].numStr}-${chunk[chunk.length - 1].numStr}`;
            });
            if (items.length === 1) {
                resultParts.push(`${prefix}${items[0].numStr}`);
            }
            else {
                resultParts.push(`${prefix}(${formattedChunks.join(', ')})`);
            }
        });
        return [...resultParts, ...noPrefix].join(', ');
    };
    const results = [];
    Object.keys(groups).forEach(name => {
        results.push(`${name} (${formatSerialNumbers(groups[name])})`);
    });
    return [...results, ...others];
};
const sendReturnReceipt = async (to, name, items) => {
    const subject = 'ยืนยันการคืนอุปกรณ์สำเร็จ (Return Receipt)';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map(item => `<li>${item}</li>`).join('');
    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>คุณได้ทำการคืนอุปกรณ์เรียบร้อยแล้ว</p>
    <ul>${list}</ul>
    <p>ขอบคุณที่ใช้บริการครับ</p>
  `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendReturnReceipt = sendReturnReceipt;
const sendDueDateReminder = async (to, name, items, dueDate) => {
    const subject = 'แจ้งเตือน: ครบกำหนดคืนอุปกรณ์ในวันพรุ่งนี้';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map((item) => `<li>${item}</li>`).join('');
    const html = `
      <h1>สวัสดีคุณ ${name}</h1>
      <p>ขอแจ้งเตือนว่าอุปกรณ์ที่คุณยืมไป จะครบกำหนดคืนในวันพรุ่งนี้ (${dueDate})</p>
      <ul>${list}</ul>
      <p style="color: red; font-weight: bold;">⚠️ คำเตือน: หากส่งคืนเกินกำหนด คุณจะถูกปรับวันละ 20 บาท ต่อชิ้น</p>
      <p>กรุณานำมาคืนตามกำหนด</p>
      <br>
      <p>ขอบคุณครับ</p>
    `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendDueDateReminder = sendDueDateReminder;
const sendOverdueWarning = async (to, name, items, dueDate, fineAmount) => {
    const subject = 'แจ้งเตือน: เกินกำหนดคืนอุปกรณ์ (Overdue Warning)';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map((item) => `<li>${item}</li>`).join('');
    const html = `
      <h1>สวัสดีคุณ ${name}</h1>
      <p style="color: red; font-weight: bold;">เราพบว่าคุณมีอุปกรณ์ที่เลยกำหนดส่งคืนแล้ว (${dueDate})</p>
      <ul>${list}</ul>
      <p>ขณะนี้คุณมีค่าปรับสะสมเบื้องต้น: <strong>${fineAmount} บาท</strong> (คิดค่าปรับ 20 บาท/ชิ้น/วัน <em>*ไม่รวมวันหยุดเสาร์-อาทิตย์และวันหยุดราชการ</em>)</p>
      <p>กรุณานำอุปกรณ์มาคืนที่ห้องสโมสรโดยด่วน เพื่อหยุดการคิดค่าปรับเพิ่มเติม</p>
      <br>
      <p>ขอบคุณครับ</p>
    `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendOverdueWarning = sendOverdueWarning;
const sendBorrowConfirmation = async (to, name, items, dueDate, borrowId) => {
    const subject = 'ยืนยันการยืมอุปกรณ์ (Borrow Confirmation)';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map(item => `<li>${item}</li>`).join('');
    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>แอดมินได้ทำการบันทึกรายการยืมอุปกรณ์ให้คุณ ดังนี้:</p>
    <ul>${list}</ul>
    <p><strong>กำหนดส่งคืน: ${dueDate}</strong></p>
    <p>กรุณารักษาอุปกรณ์ให้ดีและนำมาคืนตามกำหนด</p>
    <br>
    <p>ขอบคุณครับ</p>
  `;
    await (0, exports.sendEmail)(to, subject, html);
};
exports.sendBorrowConfirmation = sendBorrowConfirmation;
const sendAdminNewReservationNotification = async (borrowerName, itemsCount, borrowDate, returnDate) => {
    // กำหนดให้ส่งอีเมลหาแอดมิน โดยตั้งค่าผ่าน .env หากไม่มีจะใช้ EMAIL_USER อันเดียวกันกับที่ใช้ส่ง
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail)
        return;
    const subject = `[แจ้งเตือน] มีคำขอจองอุปกรณ์ใหม่จาก ${borrowerName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h1 style="color: #0F5132; text-align: center;">มีการจองอุปกรณ์ใหม่ 📦</h1>
            <p style="font-size: 16px;">ระบบได้รับการยืนยันการจองอุปกรณ์ใหม่เข้าสู่ระบบ โปรดตรวจสอบรายละเอียด:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
                <p><strong>ผู้จอง:</strong> ${borrowerName}</p>
                <p><strong>จำนวนอุปกรณ์ที่ต้องการจอง:</strong> ${itemsCount} ชิ้น</p>
                <p><strong>วันที่ต้องการยืม:</strong> ${borrowDate}</p>
                <p><strong>วันที่คืน:</strong> ${returnDate}</p>
            </div>
            <br>
            <p style="font-size: 14px; color: #555;">กรุณาล็อกอินเข้าระบบหลังบ้าน เพื่อทำการ <strong style="color: green;">อนุมัติ</strong> หรือ <strong style="color: red;">ปฏิเสธ</strong> คำขอนี้</p>
        </div>
    `;
    await (0, exports.sendEmail)(adminEmail, subject, html);
};
exports.sendAdminNewReservationNotification = sendAdminNewReservationNotification;
