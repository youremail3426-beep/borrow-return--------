/**
 * Email Service Controller
 */

const LOGO_BASE64 = "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";

const Email = {
  _send(to, subject, htmlBody) {
    if (!to) return; // Skip if no email provided
    try {
      const logoBlob = Utilities.newBlob(Utilities.base64Decode(LOGO_BASE64), 'image/png', 'logo.png');
      MailApp.sendEmail({
        to: to,
        subject: subject,
        body: "กรุณาเปิดอ่านอีเมลนี้ด้วยแอปพลิเคชันที่รองรับ HTML",
        htmlBody: htmlBody,
        inlineImages: {
          logoImage: logoBlob
        }
      });
    } catch (e) {
      console.error("Failed to send email to " + to, e);
      // We catch the error so it doesn't break the main transaction flow
    }
  },

  sendReservationRequestToUser(borrowerEmail, borrowerName, reservation, items) {
    const subject = `ได้รับคำขอจองอุปกรณ์แล้ว (รอการอนุมัติ) - ระบบยืม-คืน`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #f39c12; text-align: center;">ได้รับคำขอจองอุปกรณ์แล้ว</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ระบบได้รับข้อมูลคำขอจองอุปกรณ์ของคุณเรียบร้อยแล้ว ขณะนี้กำลัง <strong>รอแอดมินตรวจสอบและอนุมัติ</strong> โดยมีรายละเอียดดังนี้:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่คาดว่าจะมารับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์ที่จอง:</h3>
        <ul>${itemsListHtml}</ul>

        <p style="color: #e74c3c; margin-top: 20px;">
          <strong>หมายเหตุ:</strong> โปรดรออีเมลยืนยันการอนุมัติจากแอดมิน ก่อนเข้ามารับอุปกรณ์นะครับ
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReservationRequestToAdmin(adminEmail, borrowerName, reservation, items) {
    const subject = `[แจ้งเตือนแอดมิน] มีคำขอจองอุปกรณ์ใหม่จาก ${borrowerName}`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #e67e22; text-align: center;">มีการจองอุปกรณ์ใหม่ (รออนุมัติ)</h2>
        <p>เรียน แอดมิน,</p>
        <p>มีคำขอจองอุปกรณ์ใหม่เข้ามาในระบบจาก <strong>${borrowerName}</strong> โปรดเข้ามาตรวจสอบและทำการอนุมัติ/ปฏิเสธในระบบแอดมิน</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>ผู้จอง:</strong> ${borrowerName}</p>
          <p><strong>วันที่ต้องการรับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>วันที่คืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์:</h3>
        <ul>${itemsListHtml}</ul>
      </div>
    `;
    this._send(adminEmail, subject, htmlBody);
  },

  sendReservationApprovedToUser(borrowerEmail, borrowerName, reservation, items) {
    const subject = `✅ อนุมัติการจองอุปกรณ์แล้ว - ระบบยืม-คืน`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.equipment.name} (S/N: ${item.equipment.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #27ae60; text-align: center;">การจองของคุณได้รับการอนุมัติแล้ว</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>คำขอจองอุปกรณ์ของคุณได้รับการอนุมัติเรียบร้อยแล้ว กรุณามารับอุปกรณ์ตามวันที่ระบุไว้ พร้อมนำบัตรประจำตัวนักศึกษามาด้วยครับ</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่รับของ:</strong> ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(reservation.returnDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์:</h3>
        <ul>${itemsListHtml}</ul>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReservationRejectedToUser(borrowerEmail, borrowerName, reservation) {
    const subject = `❌ คำขอจองอุปกรณ์ถูกปฏิเสธ - ระบบยืม-คืน`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #c0392b; text-align: center;">คำขอจองอุปกรณ์ของคุณถูกปฏิเสธ</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ทางสโมสรนักศึกษาฯ ต้องขออภัยเป็นอย่างยิ่ง คำขอจองอุปกรณ์ของคุณสำหรับวันที่ ${new Date(reservation.borrowDate).toLocaleDateString('th-TH')} ถึง ${new Date(reservation.returnDate).toLocaleDateString('th-TH')} ไม่สามารถอนุมัติได้</p>
        <p>สาเหตุอาจเกิดจากอุปกรณ์ไม่พร้อมใช้งาน หรืออุปกรณ์มีการชำรุดเสียหาย หากมีข้อสงสัยสามารถติดต่อสโมสรนักศึกษาฯ ได้โดยตรงครับ</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
        </p>
      </div>
    `;
    this._send(borrowerEmail, subject, htmlBody);
  },

  sendBorrowEmail(borrowerEmail, borrowerName, transaction, items) {
    const subject = `การยืมอุปกรณ์สำเร็จ - ระบบยืม-คืน ครุศาสตร์อุตสาหกรรม`;
    
    let itemsListHtml = items.map((item, index) => 
      `<li>${index + 1}. ${item.name} (S/N: ${item.serialNumber})</li>`
    ).join('');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #2980b9; text-align: center;">การยืมอุปกรณ์สำเร็จ</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>คุณได้ทำการยืมอุปกรณ์จากสโมสรนักศึกษาฯ สำเร็จแล้ว โดยมีรายละเอียดดังนี้:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่ยืม:</strong> ${new Date(transaction.borrowDate).toLocaleDateString('th-TH')}</p>
          <p><strong>กำหนดส่งคืน:</strong> ${new Date(transaction.dueDate).toLocaleDateString('th-TH')}</p>
        </div>

        <h3>รายการอุปกรณ์ที่ยืม:</h3>
        <ul>
          ${itemsListHtml}
        </ul>

        <p style="color: #e74c3c; margin-top: 20px;">
          <strong>คำเตือน:</strong> หากไม่ส่งคืนอุปกรณ์ภายในวันที่กำหนด จะมีค่าปรับวันละ 20 บาท (ไม่รวมเสาร์-อาทิตย์ และวันหยุดราชการ) และหากอุปกรณ์ชำรุดเสียหาย ผู้ยืมต้องรับผิดชอบทุกกรณี
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br/>
          (อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ)
        </p>
      </div>
    `;

    this._send(borrowerEmail, subject, htmlBody);
  },

  sendReturnEmail(borrowerEmail, borrowerName, returnedCount, remainingCount, returnDate, fineAmount = 0) {
    const subject = `การคืนอุปกรณ์ - ระบบยืม-คืน ครุศาสตร์อุตสาหกรรม`;
    
    let statusMessage = remainingCount === 0 
      ? `<p style="color: #27ae60; font-weight: bold;">คุณได้ส่งคืนอุปกรณ์ครบทุกรายการแล้ว ขอบคุณครับ</p>`
      : `<p style="color: #e67e22; font-weight: bold;">⚠️ ยังมีอุปกรณ์ที่ค้างส่งอีกจำนวน ${remainingCount} รายการ กรุณาส่งคืนตามกำหนดด้วยนะครับ</p>`;

    let fineMessage = fineAmount > 0
      ? `<div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">
           <p style="color: #c62828; margin: 0; font-weight: bold;">⚠️ แจ้งเตือนค่าปรับล่าช้า</p>
           <p style="color: #d32f2f; margin: 5px 0 0 0;">เนื่องจากคุณส่งคืนอุปกรณ์เลยกำหนด มีค่าปรับชำระเพิ่มเติมจำนวน <strong>${fineAmount} บาท</strong> (คำนวณจากยอด 20 บาท/วัน ไม่รวมวันหยุดเสาร์-อาทิตย์ และวันหยุดราชการ)</p>
           <p style="color: #d32f2f; margin: 5px 0 0 0; font-size: 12px;">กรุณาติดต่อชำระค่าปรับที่สโมสรนักศึกษาฯ</p>
         </div>`
      : '';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logoImage" alt="SMO FTE Logo" style="max-width: 150px; height: auto;" />
        </div>
        <h2 style="color: #27ae60; text-align: center;">บันทึกการคืนอุปกรณ์</h2>
        <p>เรียน คุณ <strong>${borrowerName}</strong>,</p>
        <p>ระบบได้รับบันทึกการคืนอุปกรณ์ของคุณเรียบร้อยแล้ว:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>วันที่คืน:</strong> ${new Date(returnDate).toLocaleDateString('th-TH')}</p>
          <p><strong>จำนวนที่คืนสำเร็จในครั้งนี้:</strong> ${returnedCount} รายการ</p>
        </div>

        ${fineMessage}
        ${statusMessage}
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">
          สโมสรนักศึกษาคณะครุศาสตร์อุตสาหกรรม<br/>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br/>
          (อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ)
        </p>
      </div>
    `;

    this._send(borrowerEmail, subject, htmlBody);
  }
};
