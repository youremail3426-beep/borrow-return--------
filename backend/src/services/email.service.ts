import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'youremail3426@gmail.com',
        pass: process.env.EMAIL_PASS || 'ccli rvgg myog jqjm',
    },
});

const logoPath = path.join(__dirname, '../assets/logo.png');

export const sendEmail = async (to: string | string[], subject: string, html: string) => {
    try {
        const hasLogo = fs.existsSync(logoPath);

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
    } catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
};

export const sendReservationPending = async (to: string, name: string) => {
    const subject = 'การจองอุปกรณ์ของคุณอยู่ระหว่างการตรวจสอบ (Pending)';
    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>เราได้รับคำขอจองอุปกรณ์ของคุณแล้ว</p>
    <p>สถานะ: <strong>รอการตรวจสอบ (Pending)</strong></p>
    <p>เจ้าหน้าที่จะทำการตรวจสอบและแจ้งผลให้ทราบทางอีเมลนี้อีกครั้ง</p>
    <br>
    <p>ขอบคุณครับ</p>
  `;
    await sendEmail(to, subject, html);
};

export const sendReservationStatus = async (to: string, name: string, status: 'APPROVED' | 'REJECTED', reservationId?: string) => {
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
    await sendEmail(to, subject, html);
};

const groupItemsForEmail = (items: string[]): string[] => {
    const parsed = items.map(item => {
        const match = item.match(/^(.*)\s\((.*?)\)$/);
        if (match) {
            return { name: match[1].trim(), serial: match[2].trim(), orig: item };
        }
        return { name: item, serial: '', orig: item };
    });

    const groups: { [key: string]: string[] } = {};
    const others: string[] = [];

    parsed.forEach(p => {
        if (!p.serial) {
            others.push(p.orig);
        } else {
            if (!groups[p.name]) groups[p.name] = [];
            groups[p.name].push(p.serial);
        }
    });

    const formatSerialNumbers = (serials: string[]) => {
        if (!serials || serials.length === 0) return '';
        const uniqueSerials = Array.from(new Set(serials));
        if (uniqueSerials.length === 1) return uniqueSerials[0];

        const prefixGroups: { [key: string]: { numStr: string, num: number }[] } = {};
        const noPrefix: string[] = [];

        uniqueSerials.forEach((s: string) => {
            const match = s.match(/^(.*?[^\d])?(\d+)$/);
            if (match) {
                const prefix = match[1] || '';
                const numStr = match[2];
                if (!prefixGroups[prefix]) prefixGroups[prefix] = [];
                prefixGroups[prefix].push({ numStr, num: parseInt(numStr, 10) });
            } else {
                noPrefix.push(s);
            }
        });

        const resultParts: string[] = [];

        Object.keys(prefixGroups).forEach(prefix => {
            const items = prefixGroups[prefix];
            items.sort((a, b) => a.num - b.num);

            const chunks: typeof items[] = [];
            let currentChunk: typeof items = [];

            items.forEach(item => {
                if (currentChunk.length === 0) {
                    currentChunk.push(item);
                } else {
                    const prev = currentChunk[currentChunk.length - 1];
                    if (item.num === prev.num + 1) {
                        currentChunk.push(item);
                    } else {
                        chunks.push(currentChunk);
                        currentChunk = [item];
                    }
                }
            });
            if (currentChunk.length > 0) chunks.push(currentChunk);

            const formattedChunks = chunks.map(chunk => {
                if (chunk.length === 1) return chunk[0].numStr;
                return `${chunk[0].numStr}-${chunk[chunk.length - 1].numStr}`;
            });

            if (items.length === 1) {
                resultParts.push(`${prefix}${items[0].numStr}`);
            } else {
                resultParts.push(`${prefix}(${formattedChunks.join(', ')})`);
            }
        });

        return [...resultParts, ...noPrefix].join(', ');
    };

    const results: string[] = [];
    Object.keys(groups).forEach(name => {
        results.push(`${name} (${formatSerialNumbers(groups[name])})`);
    });

    return [...results, ...others];
};

export const sendReturnReceipt = async (to: string, name: string, items: string[]) => {
    const subject = 'ยืนยันการคืนอุปกรณ์สำเร็จ (Return Receipt)';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map(item => `<li>${item}</li>`).join('');

    const html = `
    <h1>สวัสดีคุณ ${name}</h1>
    <p>คุณได้ทำการคืนอุปกรณ์เรียบร้อยแล้ว</p>
    <ul>${list}</ul>
    <p>ขอบคุณที่ใช้บริการครับ</p>
  `;
    await sendEmail(to, subject, html);
};

export const sendDueDateReminder = async (to: string, name: string, items: string[], dueDate: string) => {
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
    await sendEmail(to, subject, html);
};

export const sendOverdueWarning = async (to: string, name: string, items: string[], dueDate: string, fineAmount: number) => {
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
    await sendEmail(to, subject, html);
};

export const sendBorrowConfirmation = async (to: string, name: string, items: string[], dueDate: string, borrowId?: string) => {
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
    await sendEmail(to, subject, html);
};

export const sendAdminNewReservationNotification = async (borrowerName: string, itemsCount: number, borrowDate: string, returnDate: string) => {
    // Fetch all admins from the database
    const admins = await prisma.admin.findMany({ select: { email: true } });
    let adminEmails: string | string[] = admins.map(admin => admin.email);

    // กำหนดให้ส่งอีเมลหาแอดมิน โดยตั้งค่าผ่าน .env หากไม่มีจะใช้ EMAIL_USER อันเดียวกันกับที่ใช้ส่ง
    if (adminEmails.length === 0) {
        adminEmails = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '';
    }

    if (!adminEmails || (Array.isArray(adminEmails) && adminEmails.length === 0)) return;

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
    await sendEmail(adminEmails, subject, html);
};

export const sendSuspensionMissedPickup = async (to: string, name: string, suspendedUntil: string) => {
    const subject = 'แจ้งเตือนการระงับสิทธิ์การจองและการยืมอุปกรณ์';
    const html = `
        <h1>เรียน ${name},</h1>
        <p>ท่านถูกระงับสิทธิ์การจองและการยืมอุปกรณ์เป็นเวลา 3 วัน เนื่องจากไม่มารับอุปกรณ์ตามกำหนดจอง</p>
        <p>โดยระบบจะปลดการระงับสิทธิ์อัตโนมัติในวันที่ <strong>${suspendedUntil}</strong></p>
        <br>
        <p>ขอบคุณครับ</p>
    `;
    await sendEmail(to, subject, html);
};

export const sendSuspensionOverdue = async (to: string, name: string, items: string[]) => {
    const subject = 'แจ้งเตือนอุปกรณ์เกินกำหนดคืน และระงับสิทธิ์การใช้งาน';
    const formattedItems = groupItemsForEmail(items);
    const list = formattedItems.map(item => `<li>${item}</li>`).join('');

    const html = `
        <h1>เรียน ${name},</h1>
        <p>เนื่องจากท่านเกินกำหนดส่งคืนอุปกรณ์ ดังต่อไปนี้:</p>
        <ul>${list}</ul>
        <p>ระบบจึงได้ทำการ <strong style="color: red;">ระงับสิทธิ์การจองและการยืม</strong></p>
        <p>กรุณานำอุปกรณ์มาคืนที่เคาน์เตอร์เพื่อปลดการระงับสิทธิ์</p>
        <br>
        <p>ขอบคุณครับ</p>
    `;
    await sendEmail(to, subject, html);
};

export const sendSuspensionManual = async (to: string, name: string, reason: string, suspendedUntilStr: string) => {
    const subject = 'แจ้งเตือนการระงับสิทธิ์การจองและการยืมอุปกรณ์โดยผู้ดูแลระบบ';
    const html = `
        <h1>เรียน ${name},</h1>
        <p>บัญชีของท่านถูก <strong style="color: red;">ระงับสิทธิ์การจองและการยืมอุปกรณ์</strong></p>
        <p><strong>สาเหตุ:</strong> ${reason}</p>
        <p><strong>กำหนดเวลาปลดระงับ:</strong> ${suspendedUntilStr}</p>
        <p>หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ</p>
        <br>
        <p>ขอบคุณครับ</p>
    `;
    await sendEmail(to, subject, html);
};
